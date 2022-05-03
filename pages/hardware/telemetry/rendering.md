## Rendering the Display
### Written by James Eastwood
---

Originally, we had planned to use a single display for the tachometer and speedometer. 
This screen would then communicate with our microcontroller using SPI. However, we were
plagued with technical difficulties, so instead, we went with two smaller displays that
could be run individually with two separate microcontrollers or possibly even just one.

These new screens are designed to be shields for an Arduino Uno, however, I wanted to hook
them up to the more powerful ESP32. The ESP32 that we are using has 4MB of flash storage,
WiFi, and a clockspeed of 160MHz, which should put the limiting factor on the display's
driver chip, which is exactly what we want.

Eventually, I hope to design our own shield for the project, such that we can move away
from the breadboard prototype and have a neat design where the shield and microcontroller
are just plug-and-play.

## The Library
---
I had originally thought that because I was taking a display that was meant for an
Arduino, I would have to write my own custom library for the ESP32. However, after doing
some research, I found out that they make ESP32 in the shape of an 
[Arduino Uno](https://www.amazon.com/dp/B07WFZCBH8/), making it compatible with all 
different types of shields. I wouldn't go this route, as I wanted a standalone controller.

Due to these Arduino Uno shaped ESP32 boards, it turns out the 
[MCUFRIEND_kbv](https://github.com/prenticedavid/MCUFRIEND_kbv) library I was using for my
testing is also compatible with the ESP32! I plugged both the screen and ESP32 into a
breadboard and wired it according to the library.

However, to optimize the code to render our needle on the displays, (as explained below)
I ended up creating a library/class that inherited from the library, and created some custom
functions in order to speed up some of the algorithms.

After some testing, I had my display working on the ESP32! It was time to get to work on
creating my telemetry display.

## The Thought Process
---
Before I could start rendering the shapes to the screen, I needed to come up with a game
plan that would render the shapes in the most efficient way possible. I had a target of
30 to 60FPS on the display, and in order to achieve that, I would need to ensure that I'm
re-rendering things that don't need to be every frame.

I am going for a classic dashboard type speedometer and tachometer.
<div style="text-align: center">
<img src="/SeniorDesignDoc/assets/img/doc/preview-tachometer.png" width="33%">
<img src="/SeniorDesignDoc/assets/img/doc/preview-speedometer.png" width="33%">
</div>
<br>

To re-create this, we can divide our rendering into 3 parts.
1. Background / Basic Circle Shapes (The Primitives)
2. Tickmarks & Numbering
3. The Needle

* The background and basic circle shapes do not need to be re-rendered in between each
frame, as there isn't anything that will be drawn to the screen that would overwrite them.

* The needle rotates across the screen dependent on the user's speed and RPM, this will need
to be redrawn after every frame.

* Dependent on the needle's position, some tickmarks and numbering will need to be
redrawn every frame. As the needle rotates across the screen, we need to restore the
tickmarks and numbering that it was previously covering.

## Rendering the Primitives
---
Rendering the primitives is pretty straight forward, as the library includes ways to
quickly draw circles and fill them in. So all we need to do is initialize the display, 
ensure the correct rotation, and then write our primitives.

```cpp
telemetryDisplay.begin(ILI9486);
telemetryDisplay.setRotation(1);
telemetryDisplay.fillScreen(BACKGROUND_COLOR);
telemetryDisplay.drawTelemetryPrimitives();
```

```cpp
void drawTelemetryPrimitives()
{
    overwrittenPixelBufferIndex = 0;

    fillCircle(240, 160, 150, FRAME_COLOR);
    fillCircle(240, 160, 134, FACADE_COLOR);
}
```

We then have the basic outline for our meters, and can move to the next step in the
rendering process.

## Rendering the Tickmarks and Numbering
---
To create the numbers and tickmarks on the screen, we will read the array of pixel data
we created in the [pixelData article](./pixelData.html). We just need to walk through
the array and cast the `uint16_t` subarray to a `pixel_t` type and draw it to the screen.

```cpp
for(int i= 0; i < PIXEL_DATA_SIZE; i++)
{
    pixel_t* pCurrentPixel = (pixel_t*) &pixelData[i];

    drawPixel(pCurrentPixel->x + X_OFFSET, 
            pCurrentPixel->y + Y_OFFSET, 
            pCurrentPixel->color.color);
}
```
An unoptimized solution to redrawing the tickmarks would be to run through this loop every
frame. Which is what was done initially. I will discuss how I avoided doing this in the
next section. This optimization allows us to render the tickmarks with the primitives, so 
I put this for loop inside the `drawTelemetryPrimitives()` function.

With the numbers and tickmarks written to the screen, we can draw our needle that points
to our speed/rpm to the screen!

## The Needle
---
The needle is the most complex portion of the rendering. We need to take in a speed given
to us by the user (the web socket), then convert it to an angle (theta), and then draw
a needle at that angle.

There are some limitations in the library that we have to deal with as well. We will use
a rectangle as a needle, but our library doesn't support rectangles at an angle. To get
around this, we will have to create two triangles and render them instead. This will
require some math, it looks worse than it is, I promise! 

We have the following givens:
* The origin (center of the screen)
* The needle width
* The needle length

We can find theta using a simple proportion, converting the user's speed/rpm value to
an angle.
```cpp
float convertValueToRadians(float value)
{
    return -((value * (MAX_ANGLE)) / MAX_VALUE); 
}
```

The following diagram shows the math:
<div style="text-align: center">
<img src="/SeniorDesignDoc/assets/img/doc/diagrams/BlockDiagrams-1.svg">
</div>

Now, we convert our findings to code.

```cpp
void drawNeedle(float theta)
{
    int16_t x0, y0, 
            x1, y1,
            x2, y2,
            x3, y3;
    
    /* Restore previous pixels before drawing new needle */
    if(overwrittenPixelBufferIndex > 0)
        restoreNeedlePixels();

    theta = theta - ANGLE_OFFSET;

    x0 = X_ORIGIN - ((NEEDLE_THICKNESS / 2) * cos(theta));
    y0 = Y_ORIGIN + ((NEEDLE_THICKNESS / 2) * sin(theta));

    x1 = X_ORIGIN + ((NEEDLE_THICKNESS / 2) * cos(theta));
    y1 = Y_ORIGIN - ((NEEDLE_THICKNESS / 2) * sin(theta));

    x2 = x0 - (NEEDLE_LENGTH * sin(theta));
    y2 = y0 - (NEEDLE_LENGTH * cos(theta));

    x3 = x1 - (NEEDLE_LENGTH * sin(theta));
    y3 = y1 - (NEEDLE_LENGTH * cos(theta));

    drawNeedleTriangle(x0, y0, x2, y2, x3, y3, NEEDLE_COLOR);
    drawNeedleTriangle(x0, y0, x1, y1, x3, y3, NEEDLE_COLOR);

    fillCircle(X_ORIGIN, Y_ORIGIN, NEEDLE_COVER_RADIUS, BLACK_COLOR);
}
```

We can render the triangles to the screen. We can also draw the center circle that the 
needle "mounts" to, like a real car has.

---

This is great! We have a working needle that we will create every frame, but there is just
one problem, we don't get rid of the old needle when we render a new frame. This creates a
ghost needle if the needle has to be in a different position on the next frame.

This is where our library comes into play, as we will use it to create our own functions
to keep track of the old needle's pixels. We can then restore the old pixels, restoring
the image as if the needle was never there.

I modified the library's implementation of drawing triangles. The library's method of
drawing triangles uses horizontal lines. It draws the triangle by creating horizontal
lines of various length.

Long story short, instead of drawing a regular horizontal line, I pass it off to my
horizontal line drawing function. This function reads the current color stored at those
pixels, and then pushes the pixel information to a stack. It then draws the horizontal
line like normal.

Then, when we go to the next frame, we can pop off the stack and restore those pixels
to their original value, then create a new needle, repeating the whole process!

```cpp
void drawNeedleFastHLine(int16_t x, int16_t y, int16_t w, uint16_t color)
{
    pixel_t currentPixel;
    for(int i = x; i < (x + w); i++)
    {
        currentPixel.x = i;
        currentPixel.y = y;
        currentPixel.color.color = readPixel(i, y);
        
        overwrittenPixelBuffer[overwrittenPixelBufferIndex] = currentPixel;
        overwrittenPixelBufferIndex++;
    }
    fillRect(x, y, w, 1, color); //pass of to original implementation.
}
```

This implementation takes about 40ms to render a frame. This isn't terrible, but there
are some definite improvements that we can make to help us achieve 30FPS (33ms/frame).
Below I will go into details about how I optimized it to achieve 30FPS!

```cpp
void drawNeedle(float theta)
{
    int16_t x0, y0, 
            x1, y1,
            x2, y2,
            x3, y3;
    
    /* Restore previous pixels before drawing new needle */
    if(overwrittenPixelBufferIndex > 0)
        restoreNeedlePixels();

    theta = theta - ANGLE_OFFSET;

    x0 = X_ORIGIN - ((NEEDLE_THICKNESS / 2) * cos(theta));
    y0 = Y_ORIGIN + ((NEEDLE_THICKNESS / 2) * sin(theta));

    x1 = X_ORIGIN + ((NEEDLE_THICKNESS / 2) * cos(theta));
    y1 = Y_ORIGIN - ((NEEDLE_THICKNESS / 2) * sin(theta));

    x2 = x0 - (NEEDLE_LENGTH * sin(theta));
    y2 = y0 - (NEEDLE_LENGTH * cos(theta));

    x3 = x1 - (NEEDLE_LENGTH * sin(theta));
    y3 = y1 - (NEEDLE_LENGTH * cos(theta));

    drawNeedleTriangle(x0, y0, x2, y2, x3, y3, NEEDLE_COLOR);
    drawNeedleTriangle(x0, y0, x1, y1, x3, y3, NEEDLE_COLOR);

    fillCircle(X_ORIGIN, Y_ORIGIN, NEEDLE_COVER_RADIUS, BLACK_COLOR);
}
```

## Optimizations
---
I had one big optimization idea in mind, and I thought it would result in maybe a decrease
of 5ms per frame, but in reality it almost halved our frame time. So, what did I do to
achieve this?

Recall our reference images.
<div style="text-align: center">
<img src="/SeniorDesignDoc/assets/img/doc/preview-tachometer.png" width="33%">
<img src="/SeniorDesignDoc/assets/img/doc/preview-speedometer.png" width="33%">
</div>
<br>

You'll notice that in the center this a big space where it is just black. Reading from the
display is slow, if not slower than writing to it. If we can avoid reading the pixel
values that we know will be black, we can save a lot of time.

To achieve this, we can use the distance formula! If a pixel falls in a certain radius
within the center of the circle, we know we need to render it black, and there will be
no chance of a white pixel occurring there!

(Note that with Arduino code, squaring numbers uses the `sq` macro.)
```cpp
/* if the pixel is in the inner radius, don't check the pixel, save time and
just assume that it is FACADE_COLOR or BLACK */
float xyDistanceSq = sq(i - X_ORIGIN) + sq(y - Y_ORIGIN);
if (xyDistanceSq <= sq(FACADE_INNER_RADIUS))
{
    if(xyDistanceSq <= sq(NEEDLE_COVER_RADIUS))
        currentPixel.color.color = BLACK_COLOR;
    else
        currentPixel.color.color = FACADE_COLOR;
}
```
When I was loading up the program for the first time, I was pleasantly surprised to see
that this had decreased render time by about half! This helped us achieve our 30FPS goal!

## Potential Further Optimizations
---
Sure we had achieved our 30FPS goal, but what could we do the further optimize the render?

One idea I have is that we get rid of reading from the display entirely, and since
storage is in plentiful supply on our ESP32, we could store the pixel data in a hashmap.
That way, we just feed in the coordinates of the pixel we want to restore, and we get the
orginal value that was stored there.

We would need to ensure that each coordinate has a unique position in the table to ensure
max speed, which could take some time to achieve, so I leave this as a potential further
optimization that I may do in the future.

## Wrapping Up
---
With a working display, we can now pair it with our WiFi Socket client to start reading
and rendering values from our game!