===========
F5NoMore - See every change as you make it.
===========

Boost Your Productivity
---------------
How many times do you hit refresh in an hour of coding? 10? 20? 100? Every single change, every hour of every day you have to change windows and hit refresh to see the new result. That wastes your time and breaks your focus.

F5NoMore reloads the page whenever you save a change to your source files. With F5NoMore you can leave your project open in a second window and immediately see the changes you made to the code reflected in the end product at every step in development. All without ever having hit a single key or context switch back and forth between windows.

Getting some
-----------
F5NoMore is made up of 2 parts, a Python script which watches the filesystem for changes and a Google Chrome extension which listens to the Python script to find out and actually reloads the page when necessary.

First make sure you have Python (https://www.python.org/download/) and pip (http://pip.readthedocs.org/en/latest/installing.html) installed, then install the filesystem observer with:

  python -m pip install F5NoMore
And start the observer with:

  python -m f5nomore
Now add the F5NoMore extension from the Google Chrome webstore and you're good to go: https://chrome.google.com/webstore/detail/f5nomore/bgkkcdjaonlbjoopncdpdgchdohaieap

To select the files you want to watch for a project double click on the F5 logo. Once you're happy with the files you've selected you can close the window. Single click the logo to toggle F5NoMore on and off for each tab.

The Future
-----------
F5NoMore is something I put together to save myself some time. I'm releasing it in the hopes that it can help a some other people so I'm puttting it under the MIT license - feel free to do whatever you want with it. If people turn out to like it there are a couple of additions I'd love to pursue. For example the ability to hotswap CSS without reloading the page.

The other thing I'd be interested in is making it so F5NoMore can be configured to launch the observer when your computer starts. Personally I run windows 7 and have a batch file in my startup directory that runs:

  start pythonw -m f5nomore
If someone who is familiar with Linux and Mac OS wants to talk about how best to set that up on other systems I'd be really grateful.
