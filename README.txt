===========
F5NoMore
===========

F5NoMore is a project for Web Developers to help them develop a more seamless workflow by monitoring a local project for changes and immediately reflecting updates in the browser (by automatically reloading the page).

Everyone who has had to spend a lot of time developping websites is familiar with the cycle required to debug changes in the browser:

1. Save
2. Switch to the browser window
3. F5
4. Look at the changes
5. Switch back to the editor

This gets annoying quite fast, especially when you're spending three seconds to update a single style and then another five to switch contexts and reload.
The goal of F5NoMore is to replace this whole rigamarol with:

Save ---> See Changes

Personally I find that saves me a lot of time - and even more annoyance :).


How it works 
===========
F5NoMore is composed of two parts:

* Python Package 
* Chrome Extension (https://chrome.google.com/webstore/detail/f5nomore/bgkkcdjaonlbjoopncdpdgchdohaieap)

The python script watches the filesystem for changes and when it sees changes it communicates that to the extension which reloads the page.
Having both is necessary, because Chrome Extensions do not have access to the filesystem, and external programs (i.e. the python script) can't easily manipulate Google Chrome.


Install
============
You need to install both the F5NoMore Python package and the F5NoMore Google Chrome Extension.

Python Package
-------------
There are three steps to install the python package:

* Install Python (https://www.python.org/download/)
* Install pip (http://pip.readthedocs.org/en/latest/installing.html)
* Run "python -m pip install F5NoMore"

Google Chrome Extension
--------------
Find F5NoMore on the Google Chrome Web Store and install it for free:

https://chrome.google.com/webstore/detail/f5nomore/bgkkcdjaonlbjoopncdpdgchdohaieap


Usage
===========
Once everything is installed you should start the python script with::

    python -m f5nomore

Next you should set up the files you want to watch using the Chrome extension:

* Double click on the F5 icon to open the file select dialogue.
* Add a new project
* Open the new project by clicking the arrow to the left of it
* Select the file/folders you want to watch
* Close the dialog

You can click once on the F5 icon to toggle F5NoMore on and off in a tab


History
===========

There are a variety of tools that support true live editting by hooking into Google Chrome's developer tools and only updating the parts of the page that change.
One notable tools that takes this approach is the open source Brackets Editor (http://brackets.io/).
Live editting is amazingly responsive! Unfortunately live editting is limitted to projects where the editor can easily understand how source files map to output. This basically means that only pure HTML and CSS can be handled effectively.
As soon you start involving a server for routing or templating or composing a page from multiple source files (which is most projects these days) live editting doesn't work anymore.
I love the live editting in Brackets, I highly reccommend it! I love it so much that now that I've tried it I hate going back to the agonizingly slow refresh process I used to use.
Sadly most of my projects involve a high level server meaning I can't use Brackets' live editting no matter how much I want to.
F5NoMore exists to bridge this gap. It makes the update cycle much faster by saving from constantly having to mash my F5 key and it works on any project, because it just reloads the page.
