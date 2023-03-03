# search-notes

Search Notes is an example of how you can use a combination of the APIs and Genesys [Spark](https://spark.genesys.com/) which is a CSS elements of Genesys cloud to build out a report that is interactive. This is based on a use case of seraching for interactions that have "Notes" assigned to them adn give the ability to then seach for specifc items in the notes as well as the customAttributes fields.

While this is the use case used in the example you can use this same method to show other custom reporting requirements as well. I have used both a graphical "Pie Chart" as well as a "Table" to render the data results in.

![](/docs/images/screenShot1.png?raw=true)

This example uses "Implicit Grant" OAuth2 to your Genesys Cloud ORG environment. The first thing you will need to do is to get a ClientID from your Genesys Cloud ORG with the ability to connect to the API endpoints. This will also need to have a redirect to the Hosting location of the server url for example: "http://localhost:8080/index.html". You will also need add the required "scopes" for the endpoints that you want to use. In this example we are using "analytics".

![](/docs/images/screenShot2.png?raw=true)

Once you have Created your OAuth you will need to create a "Group" to enable the users that need to have access to this new menu option visable. I would also set the visability to be for members only. 

![](/docs/images/screenShot3.png?raw=true)

Now create the "Client Application" Integration and under the configuration set the URL to the full URL including the paramiters that are required from above: "clientId", "redirectURL", "region". Ensure that the "Application Type" under the Properties is set to "standalone" this will then allow the view to be in its own section of the interface.

```
http://localhost:8080/index.html?gc_region=mypurecloud.com.au&gc_clientId=ENTER_YOUR_ID&gc_redirectUrl=http://localhost:8080/index.html
```

![](/docs/images/screenShot4.png?raw=true)

In the script.js file which runs the code you will notice that im using the Async Jobs API enpoint. While this is a great choice as then the cloud does the data aggregation and you can then pull older data then the conversation details endpoints it is worth noting the latest Data Lake aggregarted time. I do print this out in the UI as when using this endpoint this is the data that can be referenced.

If you need to use data that is newer this is still possible but you will need to use a different API endpoint that is not aggregarted for example the conversation details. This example is just that an example, not the best approach for every use case.