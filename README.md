# Obsidian Popclip Plugin
The plugin allows you to store the text you select on Obsidian which is captured by Popclip app.

## What are the requirements?
- You need a Popclip app on your MacOS.
- You need an Obsidian app on your MacOS.

![Obsidian plugin for Popclip](https://www.cbsofyalioglu.com/_next/image/?url=%2Fvideo%2Fpopclip-obsidian.gif&w=1536&q=75)

## How does it work?
There are two part of the workflow. 
- Installing the Popclip extension.
- Installing the Obsidian plugin. 




## Part I: Popclip Extension
You can select the below text to install extension.

![Popclip Obsidian Plugin](https://www.cbsofyalioglu.com/_next/image/?url=%2Fvideo%2Finstall-popclip-extension.gif&w=1536&q=75)

```YAML
# PopClip - Obsidian extension, markdown variant 
name: ObsidianClipper 
icon: O 
capture html: true
options: 
- identifier: "vault" 
  label: "Vault name" 
  type: string
- identifier: "path"
  label: "Location"
  type: string
javascript: | 
    const vaultName = encodeURIComponent(popclip.options.vault) 
    const fileLocation = encodeURIComponent(popclip.options.path)
    const data = {
      clipping: popclip.input.markdown,
      path: fileLocation || undefined,
    }
    let clipping = popclip.input.markdown 
    if (popclip.context.browserUrl.length > 0) { // append markdown source link if available 
      data["title"] = popclip.context.browserTitle
      data["source"] = popclip.context.browserUrl
    } 
    clipping = encodeURIComponent(JSON.stringify(data))
    popclip.openUrl(`obsidian://advanced-uri?vault=${vaultName}&daily=true&heading=popclip&data=%0A${clipping}&mode=append`) 
#end
```

## Part II: Installing the Obsidian plugin.
I didn't submit the plugin yet. I'm planning to submit it soon.

Therefore, you need to install it manually:
1. Download GitHub repository of [Obsidian Popclip plugin](https://github.com/canburaks/obsidian-popclip) .
2. Copy the `popclip` folder under `dist` directory.
3. Paste the copied `popclip` folder under your Obsidian plugin folder `.obsidian/plugins`.
4. Restart Obsidian.







Special thanks for Nick and EdM for their sharings on this [Popclip forum post](https://forum.popclip.app/t/clip-selection-to-obsidian/359/5)