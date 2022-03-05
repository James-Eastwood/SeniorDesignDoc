## Using Sockets for Wireless Communication
### Written by James Eastwood
---
In order to communicate between devices, we must use an IPC, more specifically, we need
to use a remote procedure call. Sockets provide a simple way to achieve this.

Sockets follow the client-server model. In our case, we will use the game as the server
and the microcontroller driving the display as the client.

Our game runs off the Unity Engine, which uses C#.


### Creating a Socket
---
We can create a socket using the following code:
```c#
hostEntry = Dns.GetHostEntry(ipAddressString);
ipAddress = hostEntry.AddressList[2];
localEndPoint = new IPEndPoint(ipAddress, port);
listener = new Socket(ipAddress.AddressFamily, SocketType.Stream, ProtocolType.Tcp);
listener.Bind(localEndPoint);
```


### Multithreading
---
```c#
listener.Listen(MAX_CLIENTS);
clientHandler = listener.Accept();
```
We use this to listen for clients trying to connect to our socket server. Furthermore,
We can then accept any incoming connections. However, this is a blocking function, meaning
that it will lock up the rest of our program (and our game) till we get a connection. We
can get around this by putting it on a different thread.
```c#
t = new Thread(new ThreadStart(runServer));
t.Start();

public void runServer()
{
    while(runThread)
    {
        clientConnected = listenForClients();
        timer.Enabled = true;
        while(clientConnected)
        {
        /* Fails if no connection to peer, then we have to listen for clients again
        Waiting for timer to go off. */
        }
        timer.Enabled = false;
    }
}
```
We use an event timer here to control when we send a data packet out through the socket,
because we don't want our microcontroller to have a backlog of old data that it has to
shift through, as the microcontroller runs much slower than our computer's processor.
```c#
private void onTimedEvent(System.Object source, System.Timers.ElapsedEventArgs e)
{
        sendData();
}
```

From here, we should have a basic socket server that we can connect to with other
processes, even ones that are on different computers (which is what we want!)

Let's try establishing a connection, once that is complete, we can start sending our data.


### Python Test Scripts
---
To test this code, we can write a simple python script to make sure that we
can successfully connect to the server.
```py
# Create a socket object
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
host = '192.168.0.101'
port = 1337

try:
    s.connect((host, port))
except TimeoutError:
    print("Connection Timed out to", host + ":" + str(port))
    exit()
```


### Sending Data Over the Socket
---
Now that we've established that we can successfully connect to the server, we can start
sending the data.

To send data over a socket, we need to pack it as a byte array. The best way I found do 
this was through the Marshal class. We can create a simple struct of the data that we want 
to send.
```c#
public struct Packet 
{
    public float velocity;
    public float rpm;
}
```
We can then convert this packet of data to a byte array. First we need to calculate how
many bytes we need. Then we allocate and create a pointer to that memory.

We then point our pointer to the location of our dataPacket (which is of type `struct 
Packet`), and copy that data into our byte array. We clean up our pointers, and then we 
can send our finished byte array over the socket!
```c#
public void sendData()
{   
    int memAllocSize = Marshal.SizeOf(typeof(Packet));
    IntPtr pDataPacket = Marshal.AllocHGlobal(memAllocSize);
    byte[] packetBuffer = new byte[memAllocSize];
            
    Marshal.StructureToPtr(dataPacket, pDataPacket, false);
    Marshal.Copy(pDataPacket, packetBuffer, 0, memAllocSize);
    Marshal.FreeHGlobal(pDataPacket);

    clientHandler.Send(packetBuffer);
    return;
}
```
Ommitted here is some error catching, but that is a work in progress at the moment.


### Receiving Data over the Socket / Microcontroller Work
---
We now switch over to our microcontroller, the ESP32, which has Wi-Fi capabilities.

We can use the Wi-Fi library to establish a connection to the socket from our game.
```c++
WiFi.mode(WIFI_STA);
WiFi.begin(SSID, PASSWORD);
waitForWiFiConnection();
while(!connectToTelemetryServer()) delay(1000);
```
Pair it with some of our helper functions...
```c++
void waitForWiFiConnection()
{
    while(WiFi.status() != WL_CONNECTED) 
    {
        delay(500);
    }
    Serial.println("Successfully connected to local network!");
}

boolean connectToTelemetryServer()
{
    if(!clientSocket.connect(HOST, PORT))
    {
        Serial.println("Connection to server failed!");
        return false;
    }
    Serial.println("Connected to the server.");
    return true;
}
```
Once we connect, we can then start receiving data.
```c++
clientSocket.read(pRecievedDataBuffer, sizeof(Packet));
```
In our code on our microcontroller, we share a similar struct to that of the one in the
game code, and we read the packet we set and store it into a buffer the size of that 
packet. 

From there, we can just cast it from the byte array into the packet struct. We are then
ready to use it on our telemetry display!