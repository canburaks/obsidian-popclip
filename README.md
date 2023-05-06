# Obsidian Popclip Plugin

## Requirements
The plugin requires you to have
- Popclip application for MacOS.
- Obsidian clipper extension for Popclip (Below)


## Popclip Extension
You can select the below text to install extension.

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