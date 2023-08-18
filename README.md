# <img src="rat-128.png" width="24" />  little-rat
Small chrome extension to monitor (and optionally block) other extensions' network calls

<a href="https://chrome.google.com/webstore/detail/little-rat/oiopkpalpilladnibecobcecijffaflf">
  <img src="assets/chrome-store.png" alt="Get Little Rat for Chrome" width="124"/>
</a>

### Chrome Web Store (Lite version)
The published extension lacks the ability to track the number of requests and notify you, but you can still use it for blocking requests. The reason is that the extension uses the `declarativeNetRequest.onRuleMatchedDebug` API which is not available for publishing in the Chrome Web Store.
Get it [here](https://chrome.google.com/webstore/detail/little-rat/oiopkpalpilladnibecobcecijffaflf)

<img src="assets/screen-gh-store1.png" alt="Screenshot for Chrome Store" width="640"/>

### Manual Installation (Full Version)
- Download the [ZIP](https://github.com/dnakov/little-rat/archive/refs/heads/main.zip) of this repo.
- Unzip
- Go to chromium/chrome *Extensions*.
- Click to check *Developer mode*.
- Click *Load unpacked extension...*.
- In the file selector dialog:
    - Select the directory `little-rat-main` which was created above.
    - Click *Open*.
### Screenshots  
  <img src="assets/screen-gh-local2.png" alt="Screenshot2 for Manual" width="1280"/>


### Author
https://twitter.com/dnak0v
