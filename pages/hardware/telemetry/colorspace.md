## RGB To 565 Colorspace Conversion
### Written by James Eastwood
---

One of the limitations of the display drivers we are using for the telemetry display is
that it takes its colors in 565 format. 565 format takes up 16 bits, and allocates the
five most significant bits for red, the middle six bits for green, and the remaining five
bits for blue.

&#10240;     | Red            | Green             | Blue
------------ | ---------------|-------------------|----------------|
Color Bits   | 00 01 02 03 04 | 00 01 02 03 04 05 | 00 01 02 03 04 |
Overall Bits | 00 01 02 03 04 | 05 06 07 08 09 10 | 11 12 13 14 15 |

An issue arises when we want to take our reference image and start drawing it to the
display. This is because our image's colors are stored as an RGB triplet. So when we go
to extract the colors, so we can copy them to the display, they are three bytes long
(ex. `0xFFFFFF`) instead of the needed two (ex. `0xFFFF`).

To prevent loss of color accuracy, I needed a way to see what colors where on both the
RGB colorspace and the 565 colorspace. I wrote a simple python script that works as a
color picker, showing what a color would look like in both colorspaces.

It is definitely a bit overkill, but it was a fun little side project that allowed me to
learn about creating windows with python. It consists of three sliders, one for each color
(red, blue, and green). To the right is a little preview window, showing what the color
looks like along with the appropriate hexcode in both 565 and RGB format. If the module
`pypyerClip` is installed, the user can click the preview color, and it will copy the 565
color to the clipboard. Shown below is a little preview of what this looks like:

<div style="text-align: center">
<img src="/SeniorDesignDoc/assets/img/doc/565colorFinder.png" width="75%">
</div>
<br>

### The Science behind converting the Colors
---
Who doesn't love a bit of bit manipulation? Recall from [our data packing article](./dataPacking.html) 
that when we extracted our pixel data from our image file, we got it in RGB colorspace, 
but then when we wrote the binary file, we wrote it in 565 format. So how did we convert 
it over? Some bit manipulation (and proportion magic!)

Let's take a look at some python code...
```py
def convertColorsTo565Format(t: Tuple):
    red = t[0] // 8
    gre = t[1] // 4
    blu = t[2] // 8

    colorIn565 = red << 11
    colorIn565 |= gre << 5
    colorIn565 |= blu

    return colorIn565
```
Our hex/RGB color gets passed in as a tuple. We then do a little math to get the
colors on the correct proportional scale. With the RGB colors, we the maximum value is 255
While on the 565 colorscale, Green is on a scale of 0-63 (64 numbers). Red and blue are on 
a scale of 0-31 (32 numbers). We divide accordingly. Now we need to store it into one 
16-bit integer (because we are doing this on a computer, it's most likely a 32 bit 
variable, but it doesn't affect our result). First, we will store our red value, and bit
shift it to the left 11 times. Then we will store our green result bit shifting it left
five times, then we OR it with the red result. Lastly, we can attach the blue result just
by OR'ing our result with the calculated blue value. No shift required for blue as it
takes up the last 5 bits. 

We have successfully went from RGB colorspace to 565 colorspace, and the colors look great
on the display!