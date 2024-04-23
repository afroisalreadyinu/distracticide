# distracticide

An extension for reminding you of better things to do when you get distracted again.

## Description

Distracticide is a very simple extension that lets you block distracting web
pages by showing you a list of activities of your own choosing when you attempt
to navigate to one of them. The hosts of the distraction pages and the
activities can be configured, and are synched on your Firefox profile.

## Developing

You can either use Mozilla's
[web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
tool, or install it temporarily using the debug page.

### Temporary install

In a new tab, type `about:debugging`, click on "Load temporary Add-on", and
select `manifest.json` in the file navigation. The extension is now running. If
you want to view the debug console for the extension, click on "Inspect" next to
the freshly installed extension. After any changes, click "Reloaed" to make sure
they take effect. You might also one want to install the extension in a new
browser profile, which you can create on the `about:profiles` page.

### Using web-ext

This is as simple as running `web-ext run` in the `firefox` directory. The
extension will be automatically reloaded when files change.

## Creating a distribution package

The command `web-ext build` will create a zip file in the directory
`firefox/web-ext-artifacts`, the filename of which will contain the version in
`manifest.json`.

# Todos

[ ] Show last done items

[ ] Reordering action items

[ ] Add couple of domains when installed

[ ] Better styling for forms
- [Web Design in 4 minutes](https://jgthms.com/web-design-in-4-minutes/)
- [Awesome CSS Frameworks](https://github.com/troxler/awesome-css-frameworks#very-light)

[ ] Edit action items by clicking on them

[ ] Add a button to pop up the config page

[ ] Statistics (how often, how long, how many times per hour)

## Done

[x] What about pages where base domain redirects to www?

[x] Use [web-ext](https://github.com/mozilla/web-ext) to do stuff (see also [this](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/))

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
