# distracticide

An extension for reminding you of better things to do when you get distracted again.

## Description

Distracticide is a very simple extension that lets you block distracting web
pages by showing you a list of activities of your own choosing when you attempt
to navigate to one of them. The hosts of the distraction pages and the
activities can be configured, and are synched on your Firefox profile.

## Developing

On Firefox, open the profiles page by going to `about:profiles`, and create a
new profile for extension debugging. Start a browser session in this profile,
open `about:debugging`, click on "Load temporary Add-on", and select
`manifest.json`. The extension is now running. If you want to view the debug
console for the extension, click on "Inspect" next to the freshly installed
extension.

```bash
alias firefox=/Applications/Firefox.app/Contents/MacOS/firefox
firefox --createprofile clitesting
firefox --profile ~/Library/Application\ Support/Firefox/Profiles/ljpfprq0.clitesting
```

# Todos

[ ] What about pages where base domain redirects to www?

[ ] Show last done items

[ ] Reordering action items

[ ] Add couple of domains when installed

[ ] Better styling for forms
- [Web Design in 4 minutes](https://jgthms.com/web-design-in-4-minutes/)
- [Awesome CSS Frameworks](https://github.com/troxler/awesome-css-frameworks#very-light)

[ ] Use [web-ext](https://github.com/mozilla/web-ext) to do stuff (see also [this](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/))

[ ] Edit action items by clicking on them

[ ] Add a button to pop up the config page

[ ] Statistics (how often, how long, how many times per hour)

## Done

[x] Option to hide the "want to go there" button

[x] Manifest v3 (https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/)

[x] Change page tests to use actual elements in a frame

[x] Icon https://icon.kitchen/

[x] Adding and removing URLs

[x] Navigating to the page nevertheless

[x] Editing the stuff shown

[x] Error handling

[x] Make links clickable

[x] Shorten links

[x] Color schema

[x] Publish extension ([guide](https://extensionworkshop.com/documentation/publish/))
