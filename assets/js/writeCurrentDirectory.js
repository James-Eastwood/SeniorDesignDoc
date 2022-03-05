currentPath = window.location.pathname;
finalString = ''

if(currentPath != '/SeniorDesignProject/index.html' && currentPath != '/SeniorDesignProject/pages.html')
{
    currentPath = currentPath.replace('.html', '')
    pathArray = currentPath.split('/');
    
    for(i = 2; i < pathArray.length; i++)
    {
        pathToFile = '/SeniorDesignProject'
        startingIndex = currentPath.search(pathArray[i]);
        pathToFile = currentPath.slice(0, startingIndex + pathArray[i].length)
        pathToFile += '.html'

        newLink = '<a href="%FILEPATH%">%NAME%</a>'
        pathArray[i] = pathArray[i].replace('.html', '')
        newLink = newLink.replace('%FILEPATH%', pathToFile);
        newLink = newLink.replace('%NAME%', pathArray[i]);
        
        finalString += newLink;
        if(i + 1 != pathArray.length) finalString += " >> ";
    }


    document.getElementById("this").innerHTML = finalString;

}
