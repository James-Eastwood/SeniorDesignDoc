## Shifter & Handbrake
### Written by James Eastwood
---
### Hardware Implementation
For our game, we wanted a way to shift up and down through the gears like you would
in an actual manual car. We decided to keep it simple, and implement a sequential
shifter into our game. 

<div style="text-align: center">
<img src="/SeniorDesignProject/assets/img/doc/Shifter.jpg" width="50%">
</div>

To achieve this, we are using an arcade joystick with some 3D-printed modifications.
 - Custom Shift/Handbrake Knob
 - Custom Faceplate
 - Limiter Plate (To prevent Left/Right motion of Joystick)

### Embedded Software
---
The microcontroller we are using, the Arduino Pro Micro, uses an Atmega 32u4 chip. This
chip has the ability to communicate with a computer with it's USB interface. This allows
us to use it as a HID (Human Interface Device), or more specifically in our case, a game
controller.

Fortunately for us, there is an Arduino Library that lets us easily create a joystick,
we just need to provide the values to the interface. We can do that easily with the code
shown below. This code is just to verify that we have a working joystick. Our real code
will be more complex, but we can use this along with `joy.cpl` in Windows to verify our
hardware is working as intended.

```c++
#define PIN_SHIFT_UP 3
#define PIN_SHIFT_DOWN 4

Joystick_ joystick;

void setup()
{
    pinMode(PIN_SHIFT_UP, INPUT);
    pinMode(PIN_SHIFT_DOWN, INPUT);

    joystick.begin();
}

void Loop()
{
    joystick.setButton(0, digitalRead(PIN_SHIFT_UP));
    joystick.setButton(1, digitalRead(PIN_SHIFT_DOWN));
}
```

Now we need to hook up the arcade joystick to the microcontroller and read its values
to know when it is pressed. We can do this using a simple switch circuit.

<div style="text-align: center">
<img src="/SeniorDesignProject/assets/img/doc/diagrams/CircuitDiagrams-1.svg" width="75%">
</div>

We rinse and repeat this for the up and down buttons of both joysticks, and we end up with
something like this schematic.

<div style="text-align: center">
<img src="/SeniorDesignProject/assets/img/doc/diagrams/CircuitDiagrams-2.svg" width="75%">
</div>