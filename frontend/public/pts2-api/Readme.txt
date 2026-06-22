This API for PTS-2 controller in Javascript

Here are the list of things you need to take into account at launching it:

1. You can test this API using a web browser, but for this you need to open these web-pages from some web-server because due to the CORS policy it will not work if you simply open these pages in the web browser. For example use Visual Studio to run the IIS server and view the pages from there.

2. This Javascript API uses Basic authentication, so make sure that on a configuration DIP-switch on the PTS-2 controller DIP-2 switch is set to ON position. If it is not so - then set it and restart the PTS-2 controller to accept the changes. Type of authentication is configured in the js\pts.js file in the function 'sendRequest'.  

3. This API is set to use HTTPS protocol. For this make sure that DIP-1 switch is set to OFF position on the PTS-2 controller board. It is not so - then set it and restart the PTS-2 controller to accept the changes. Type of protocol is configured in the js\pts.js file in the function 'sendRequest'.  

4. This API is set to connect to the PTS-2 controller using IP-address 192.168.1.117. The IP-address to connect to the PTS-2 controller is configured in the js\pts.js file in the function 'sendRequest'. 

5. Within the Javascript files you need to find a file named pts.js and in this file there is a function named 'sendRequest', which contains specification of the IP-address of the PTS-2 controller and user credentials. Set there the user credentials configured in the PTS-2 controller and also check that IP-address is correct. If your web server is running HTTPS - then in the connection path state https, otherwise If your web server is running HTTP - then in the connection path state http.

6. From your web server open the index.html page from the Javascript API and it should read data from the PTS-2 controller. There are several pages in this Javascript API for pumps control, tanks monitoring and reports generation.