# distracticide

An extension for reminding you of better things to do when you get distracted again.

## Developing

On Firefox, open the profiles page by going to `about:profiles`, and create a new profile for
extension debugging. Start a browser session in this profile, open `about:debugging`, click on "Load
temporary Add-on", and select `manifest.json`. The extension is now running. If you want to view the
debug console for the extension, click on "Inspect" next to the freshly installed extension.

```bash
alias firefox=/Applications/Firefox.app/Contents/MacOS/firefox
firefox --createprofile clitesting
firefox --profile ~/Library/Application\ Support/Firefox/Profiles/ljpfprq0.clitesting
```

# Todos

[ ] Change page tests to use actual elements in a frame

[ ] Compatibility with Chrome (see [here](https://blog.shahednasser.com/making-your-extension-compatible-with-both-chrome-and-firefox/))

[ ] Move to MV3 https://blog.mozilla.org/addons/2022/10/31/begin-your-mv3-migration-by-implementing-new-features-today/

[ ] Use [web-ext](https://github.com/mozilla/web-ext) to do stuff (see also [this](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/))

[ ] Publish extension ([guide](https://extensionworkshop.com/documentation/publish/))

[ ] General styling

[ ] Styling of forms

[ ] Edit action items by clicking on them

[ ] Add a button to pop up the config page

[ ] Statistics (how often, how long, how many times per hour)

[ ] Testing

[ ] Add linting

[x] Adding and removing URLs

[x] Navigating to the page nevertheless

[x] Editing the stuff shown

[x] Error handling

[x] Make links clickable

[x] Shorten links

[x] Color schema
