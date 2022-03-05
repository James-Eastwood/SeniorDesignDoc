## Telemetry Display
### Written by James Eastwood
---
### More Information on Specific Subjects
- [Wireless Communication (Sockets)](./telemetry/sockets.html)
- [Storing Pixel Data](./telemetry/pixelData.html)
- [Pixel Data Packing / Unpacking (Obsolete)](./telemetry/dataPacking.html)
- [RGB Colorspace to 565 Colorspace](./telemetry/colorspace.html)
- [Rendering the Display](./telemetry/rendering.html)

### Putting it all Together

After implementing all of our features separately, we can now combine them together to
achieve our final product!

Lets take a look at the main program...

```cpp
void setup() 
{
    TaskHandle_t* pWifiTaskHandle;
    TaskHandle_t* pDisplayTaskHandle;
    pRecievedPacket = (packet_t*) malloc(sizeof(packet_t));
    memset(pRecievedPacket, 0, sizeof(packet_t));

    Serial.begin(230400);

    xTaskCreatePinnedToCore(DisplayThread, "Display Functionality", 40960, NULL, 5, pDisplayTaskHandle, 0);
    /* Don't pin the wifi thread to the core. Watchdog still needs to do it's stuff */
    /* Watchdog : Mom said it's my turn to use the microcontroller! */
    wiFiThread(NULL);
}
```
Since we have two cores to use on our ESP32, we can assign one to handle the WiFi features
and another one to handle rendering data to the display!

We pin the display to the first core, and we will run the WiFi interaction on the second
core, but we don't pin it, because our RTOS has a watchdog that still needs to run.

The first core needs to run the watchdog as well, but we execute that in the downtime
between frames.

#### WiFi Thread
```cpp
void wiFiThread(void* parameters)
{

    Serial.printf("Starting WiFi Client...\n");
    WiFiClient clientSocket;
    
    while(true)
    {
        if(WiFi.status() != WL_CONNECTED)
            connectToWiFi(&clientSocket);
        
        if(!clientSocket.connected())
            connectToServer(&clientSocket);
        
        else
            recieveDataFromServer(&clientSocket);
    }
}
```
In our WiFi thread, we just loop waiting for a WiFi connection, then loop waiting for
a server connection, and once we have both, we receive the data over the server!

#### Display  Thread
```cpp
void DisplayThread(void* parameters)
{
    delay(1000);
    Serial.printf("Starting Telemetry Display...\n");
    TelemetryDisplay telemetryDisplay;
    
    telemetryDisplay.begin(ILI9486);
    telemetryDisplay.setRotation(1);
    telemetryDisplay.fillScreen(BACKGROUND_COLOR);
    telemetryDisplay.drawTelemetryPrimitives();

    uint32_t prevTime;
    float theta;
    while(true) {
        prevTime = millis();
        
        #if defined(CREATE_SPEEDOMETER)
            telemetryDisplay.drawNeedle(telemetryDisplay.convertValueToRadians(pRecievedPacket->speed));
        #elif defined(CREATE_TACHOMETER)
        telemetryDisplay.drawNeedle(telemetryDisplay.convertValueToRadians(pRecievedPacket->rpm));
        #endif

        /* Relax for the remaining time */
        /* Ensure we didn't take an unexpected amnt of time for this frame, if we did, no relaxation! */  
        if(TIME_TAKEN < TARGET_FRAMERATE)
            vTaskDelay(((1000 / TARGET_FRAMERATE) - (millis() - prevTime)) / portTICK_PERIOD_MS);
    }
}
```
In our display thread, we wait 1000ms before starting anything, because we need to let the
WiFi core boot first to initialize some variables for us. From there, we start up the
display and render our primitives. Then we enter an infinite loop, drawing the correct
needle, and then sleeping when it is time to recreate a frame. We use `vTaskDelay` here, 
so we can give the RTOS some time on the core.

And that's everything, our telemetry display is working as intended!

#TODO: communication diagram