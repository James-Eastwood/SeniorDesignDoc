## Data Packing for the Telemetry Display (Obsolete)
### Written by James Eastwood
---

<div style="color: red; font-weight: bold">
    The information below is obsolete, as I am no longer using a binary file to store the
    pixel data. This is due to the fact that it is much slower reading from the SPIFFS
    than it is using a header file as explained in the 
    [PixelData Article](./pixelData.html)
    <br> <br>
</div>

One of the big problems with the library that we are using to render our images to the
display is that it doesn't support 
[anti-aliasing](https://en.wikipedia.org/wiki/Anti-aliasing). We also have a variety of
complex shapes that would be very difficult to draw using primitives.

One solution we had was to take our reference image, and export some pixel data in
a particular way such that our microcontroller can read it.

### Exporting the Pixel Data to a Binary File
---
To "optimally" store the data for the program. I figured it would be best to write it to
a binary file. I wrote a simple python script that would take our reference image, look
at the pixels and colors in it, then write the data about those pixels to a binary file.

However, we don't want all the pixels to be written to the screen, as some of them
can be "fast-drawn" using the hardware. So we will use a special version of our reference
image. From there, we can even blacklist some specific pixels as well. Here is a preview
of that special image and the blacklisted pixels!

<div style="text-align: center">
<img src="/SeniorDesignProject/assets/img/doc/telemetry-ref.png" width="50%">
</div>

```py
COLOR_BLACKLIST = [(232, 232, 232, 255), (32, 32, 32, 255), (0, 0, 0, 255), (168, 168, 168, 255)]
```
It is important to note that the pixels must be converted to 565 format from the usual RGB
format. More information on that can be read [here](/colorspace.html).

Now, let's talk about the python script!

First we need to create our file. It's important that we tell Python we want to open it as
a binary file, as we are writing binary data to it! We can also open our image.
```py
binFile = open('../demos/readPixelValues/data/pixelData.bin', 'wb')
imageFile = Image.open('../doc/ref-display.png')
```
Right now, we are just exporting our data to one of the demos, so we can test that the
values we are reading on the microcontroller is correct. Eventually we will switch it
around.

Next, we will step through every pixel in the image, and store it into a dictionary, where
the keys are colors and the values are coordinates.
```py
# Get the color of every pixel
colorDict = {}
for h in range(0, IMAGE_HEIGHT):
    for w in range(0, IMAGE_WIDTH):
        currentColor = imageFile.getpixel((w, h))

        if(currentColor not in colorDict.keys()):
            colorDict[currentColor] = []
        colorDict[currentColor].append((w, h))
imageFile.close()
```
I should mention we aren't using the most efficient algorithms here, but we only run this
script every so often when I make a change to our reference layout. So I can get away with
it. (Just don't tell my computer science professors)

Next I'll sort the dictionary by the length of the array that stores the coordinates in
decreasing order. I did this originally to help with debugging, and left it in, cause it
neatens things up in my opinion.
```py
sortedKeys = sorted(colorDict.keys(), key = lambda x : len(colorDict[x]), reverse= True)
```

Now we can finally start writing the binary data.
```py
for color in sortedKeys:
    if color in COLOR_BLACKLIST:
        continue
    else:
        for i in range(len(colorDict[color])):
            totalPixelCount += 1
            binFile.write(colorDict[color][i][0].to_bytes(2, "little"))
            binFile.write(colorDict[color][i][1].to_bytes(2, "little"))
            binFile.write(convertColorsTo565Format(color).to_bytes(2, "little"))
binFile.close()
```
We step through every color, ensure it isn't in the color blacklist, then step through
every pixel coordinate. We write the x and y location of the pixel, then convert our
color to 565 format before writing it.

It's important to note that we must convert all these integer values to bytes using 
`.to_bytes`. The microcontroller we are using is in little endian, so we set that
accordingly.

Let's check our work by reading the binary file!
<div style="text-align: center">
<img src="/SeniorDesignProject/assets/img/doc/binaryData.jpg" width="75%">
</div>
Looking at `0xC9004600FFFF` (The first entry), we can see that we are storing the color
`0xFFFF` (White) to the location `0x00C9, 0x0046`. This looks like a success!

We then close the binary file and our work is complete! We are ready to upload and read it
in our microcontroller.

### Storing the Binary Data on a Microcontroller
---
Currently, we are using a ESP8266 to run our display. There is a portion of the flash
memory included with this microcontroller that can support a file system on it. It is
called the SPIFFS (Presumably meaning: Serial Peripheral Interface Flash File System). The
file system only supports one level, which is more than fine for our purposes, as we are 
only storing our one generated file.

Once we upload it, we can instantly start using in it our code.
```c++
SPIFFS.begin();
filePixelData = SPIFFS.open("/pixelData.bin", "r");

char* pReadBytes = (char*)malloc(sizeof(pixel_t));
while(filePixelData.position() <= filePixelData.size())
{
    filePixelData.readBytes(pReadBytes, sizeof(pixel_t));
    pCurrentPixel = (pixel_t*) pReadBytes;
    ...
    filePixelData.seek(sizeof(pixel_t), SeekCur);
}
free(pReadBytes);
filePixelData.close();
```
We step through the binary data at the size of our pixel struct, which consists of the
following data:
```c++
typedef struct 
{
	uint16_t x;
	uint16_t y;
	uint16_t color;
} pixel_t;
```
We convert the buffer of the bytes we read to the pixel structure, and then we are ready
to write it to the screen using the screen's library interface.

Currently, we don't do anything with the data, but eventually, we will read it and write
it to the display.