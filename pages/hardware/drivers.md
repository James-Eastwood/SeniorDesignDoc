## Windows Driver Support
### Written by James Eastwood
---
There is built in support using the Arduino Library to make our steering wheel plug and
play. However, we want to add something commonly known as force feedback to our wheel. 
This will allow us to simulate the feedback that you would get from a real car through
the steering wheel. Things such as jolts when going over a pothole can be simulated this
way.

The way this works is similar to how an Xbox or PlayStation controller vibrates. We're 
hoping to use that same technology, but modify it to fit our needs.

The joystick library we are using doesn't support this feature, and really is only a 
one lane street of communication from our controller to the computer. We want to turn
that one way street into a two-way street, so that the game can send commands to the 
controller. We can then interrupt those commands and make the wheel react accordingly.

To achieve this, we are having to dive deep into Windows Drivers and how they interface
with the external devices. This is a big task, as it is completely new to us, but we are
hoping to report our findings below at some point.
