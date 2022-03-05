## Saving Pixel Data for the Telemetry Display
### Written by James Eastwood
---

The design that we went with for our speedometer and tachometer is very complex, and it
is something that cannot be done (easily) with just basic shapes that can be generated
through our provided display libraries, so I needed to come up with an alternative
solution for rendering our designs to the screen.

This article builds off my [Data Packing](./dataPacking.html) article, as similar methods 
are used again for our new method, and I will cover them again here.

Due to their complex shapes, we need to render each pixel individually. I need to save
the individual pixel's location and color in order to be able to render them.
Previously, I wrote this pixel information to a binary file.

However, instead of writing our data to a binary file, I will be writing it to a header
file that we can include in our program. The pixel data will be stored in one big array
that will be written in program memory, so that it will not take away our precious RAM!

### The Reference Images
---
We are using a ESP32 with 4MB of flash storage. This gives us plenty of room to
store our header file! Due to the fact that we are prioritizing speed here, the extra
space allows us to avoid trying to compact our data down, which could jeopardize 
performance.

We begin with our reference images that we wish to write our header files about. These
are slightly different images than that of the mock-up designs that we created. I do this
because I am able to quickly render the outer rings of the design, so we don't need to
account for them when we go to render pixel-by-pixel.

<div style="text-align: center">
<img src="/SeniorDesignProject/assets/img/doc/preview-speedometer.png" width="33%">
<img src="/SeniorDesignProject/assets/img/doc/speedometer_to_compile.png" width="33%">
<br><em>The Render of the speedometer verses the reference image we will use</em>
</div>

<div style="text-align: center">
<img src="/SeniorDesignProject/assets/img/doc/preview-tachometer.png" width="33%">
<img src="/SeniorDesignProject/assets/img/doc/tachometer_to_compile.png" width="33%">
<br><em>The Render of the tachometer verses the reference image we will use</em>
</div>
<br>

### Using a Python Script to Generate a Header File
---
Each of our reference images is 268x268 pixels. If we were to write our header file by
hand, we would need to write out the data for 143,648 pixels! That's too much. On top of
that, we don't need to put every single pixel from the image in our header file. Let's 
dive in to what pixels we will write, and then, I'll explain how I created a python script
to do the work for me.

From our reference images, we can ignore the background and black circle, as they will be
handled separately. (more information on that can be found at my 
[Rendering](./rendering.html) article) This leaves the various white tick marks, the red
and yellow stripes, and the lettering/numbering to get the pixel data about.

To get the information on the pixels we do need, we can extract them using a python 
script!

We start off by creating a dictionary for the image. Our keys are the various colors in
the image, and our values are a list of all the locations where that color resides in our
image. We can ignore specific colors if they are in our `COLOR_BLACKLIST` (such as the 
background or the black circle) or if they have a high alpha value.
```py
colorDict = {}
for h in range(0, IMAGE_HEIGHT):
    for w in range(0, IMAGE_WIDTH):
        currentColor = imageFile.getpixel((w, h))

        if not ignoreBlacklist:
            if (currentColor in COLOR_BLACKLIST or currentColor[3] == 0):
                continue

        if(currentColor not in colorDict.keys()):
            colorDict[currentColor] = []

        colorDict[currentColor].append((w, h))
```

With our dictionary of information on our image, we can begin writing our header file! 
After I create the header file, I start with some template strings, and by replacing 
specific keywords, I can create the inner-workings of our header file. I create a 
`#define` with the size of the array, and create a 2D array of type `uint16_t`. 
Each index of the parent array stores a subarray that contains the
x, y, and color value of our pixels. Our display uses colors in the 565 format, so I
convert them here. More info can be found in the [Colorspace](./colorspace.html) article. 
The `PROGMEM` keyword ensures that this data is written to the program memory, so we don't
take up our RAM.

```py
defineArrayLengthString = '#define PIXEL_DATA_SIZE *SIZE*\n\n'

initArrayString = 'const uint16_t pixelData[][3] PROGMEM = {\n'

arrayValueString = '{*X*, *Y*, *COLOR*},\n'

endArrayString = '};\n'
```

From there, we just iterate through my dictionary, creating a `arrayValueString` for each
pixel. Ending off with the `endArrayString`. 

```py
headerFile.write(template.defineArrayLengthString.replace('*SIZE*', str(pixelCount)))

headerFile.write(template.initArrayString)
for color in colorDict.keys():
    for i in range(len(colorDict[color])):
        valueToWrite = template.arrayValueString
        valueToWrite = valueToWrite.replace('*COLOR*', formatIntToHex(convertColorsTo565Format(color)))
        valueToWrite = valueToWrite.replace('*X*', str(colorDict[color][i][0]))
        valueToWrite = valueToWrite.replace('*Y*', str(colorDict[color][i][1]))
        headerFile.write(valueToWrite)
    
headerFile.write(template.endArrayString)
```

This creates a header file that looks similar
to the following:

```cpp
#define PIXEL_DATA_SIZE 7042

const uint16_t pixelData[][3] PROGMEM = {
{139, 2, 0xa904},
{140, 2, 0xa904},
{141, 2, 0xa904},
{142, 2, 0xa904},
{139, 3, 0xa904},
{140, 3, 0xa904},
{141, 3, 0xa904},
{142, 3, 0xa904},
{143, 3, 0xa904},
{144, 3, 0xa904},
{145, 3, 0xa904},
{146, 3, 0xa904},
...etc
};
```
To write these values to the screen, all we need to do is walk through the array. When we
got to write these values to the screen, I will cast them to a `pixel_t` type, which just
helps with clarity.
```cpp
typedef union
{
    struct
    {
        uint16_t red : 5;
        uint16_t green : 6;
        uint16_t blue : 5;
    } rgb;
    uint16_t color;
} color_t;

typedef struct 
{
	int16_t x;
	int16_t y;
	color_t color;
} pixel_t;
```
```cpp
pixel_t* pCurrentPixel = (pixel_t*) &pixelData[i];

drawPixel(pCurrentPixel->x + X_OFFSET, 
          pCurrentPixel->y + Y_OFFSET, 
          pCurrentPixel->color.color);
```
(The offsets are used to shift the origin back to the top left corner of the display)

If we were to generate an image solely based on this data, we'd get something like this:
<div style="text-align: center">
<img src="/SeniorDesignProject/assets/img/doc/headerFilePreview.png" width="50%">
</div>

However, when we combine that with the work done by our microcontroller, we achieve our
desired effect! The final result is shown in the [Rendering article](./rendering.html).

These header files take up about 140KB, which is a lot. However, there is plenty of space
on the microcontroller for it. If push comes to shove, some organization can be done, 
because there is a lot of repetition in the header file, which can be reduced down a bit.
Despite all this, it allows our program to work as intended.