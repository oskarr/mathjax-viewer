var app = new Vue({
    el: "#app",
    data: {
        theme: "default",
        toolbox: "generic",
        inputty: "",
        autorender: true,
        dlformat: "png",
        
        showCheatSheet: false,
        jaxRenderer: null,
        mathInput: "TeX",

        cTextColor: "#ffffff",
        cBkgColor: "#333333",
        cBorder: "",

        // Loaded separately
        // TODO avoid redundancy
        themes: {},
        groupedthemes: {},
        groupedtoolboxes: {},
    },
    methods: {
        inputCallback: function(e) {
            if (this.autorender || e.which == 13)
                this.render()
        },
        render: function() {
            var el = document.getElementById("putty")
            el.innerHTML = this.getPrerender()
            MathJax.Hub.Typeset(el);
        },
        updateTheme: function() {
            if(this.theme == "custom") {return}

            this.cTextColor = this.themes[this.theme].text;
            this.cBkgColor = this.themes[this.theme].bg;
            if("border" in this.themes[this.theme]) {
                this.cBorder = this.themes[this.theme].border;
            } else {this.cBorder = "";}
        },
        updateInputMethod: function() {
            this.render()
        },
        insertMath: function(tool) {
            var text, offset;

            switch (this.mathInput) {
                case "AsciiMath":
                    text = (tool.hasOwnProperty("ascii")) ? tool.ascii:tool.latex;
                    break;
                default:
                    text = tool.latex;
                    break;
            }
            switch (this.mathInput) {
                case "AsciiMath":
                    offset = (tool.hasOwnProperty("asciiOffset")) ? tool.asciiOffset:((tool.hasOwnProperty("latexOffset")) ? tool.latexOffset:0);
                    break;
                default:
                    offset = (tool.hasOwnProperty("latexOffset")) ? tool.latexOffset:0;
                    break;
            }
            // will give the current postion of the cursor
            var el = document.getElementById("inputty")
            // TODO, make things with nonzero offset insert things on both sides of the selected text.
            var selStart = el.selectionStart + 0;
            var selEnd = el.selectionEnd + 0;

            // will get the value of the text area
            var x = el.value

            // setting the updated value in the text area
            el.value = x.slice(0,selEnd)+text+x.slice(selEnd);

            // Force re-render.
            this.inputty = el.value
            this.inputCallback({which: 0})
            
            el.focus()
            var tarPos = selEnd + offset + text.length
            el.setSelectionRange(tarPos, tarPos)
        },
        getLink: function() {
            // Compute data string
            var data = ""
            try {
                data = 
                "base64=" + encodeURI(btoa(this.inputty))
            } catch (err) {
                if (err instanceof DOMException) {
                    try {
                        var enc = new TextEncoder("utf-8");
                        data = "b64_utf8=" + encodeURI(btoa(enc.encode(this.inputty)))
                    } catch(error) {alert("Failed to copy: " + error)}
                } else alert("Failed to copy: " + err)
            }


            // Compute theme string
            var theme = ""
            if(this.theme=="custom")
                theme = "theme=" + (this.cTextColor.replace("#","")+"-"+this.cBkgColor.replace("#",""))
            else if(this.theme != "default")
                theme = "this.theme"

            // Compute toolbox string
            var toolbox = (this.toolbox == "generic") ? "":"toolbox=" + this.toolbox
            var inputMode = (this.mathInput == "TeX") ? "":"inputmode=" + this.mathInput

            return location.href.split("#!")[0] + "#!" + [theme, toolbox, inputMode, data].filter(a => a != "").join("&")
            
        },
        //
        // Download utilities
        //
        getPrerender: function() {
            if(this.mathInput == "AsciiMath")
                return "`" + this.inputty + "`";
            else
                return "\\[" + this.inputty + "\\]";
        },
        getJaxRenderer: function() {
            if(Cookies.get("mjx.menu") != undefined && Cookies.get("mjx.menu").includes("renderer"))
                return Cookies.get("mjx.menu").split("renderer:")[1].split("&;")[0]
            else
                return MathJax.Hub.config.jax[0].split("output/")[1]
        },
        getSVG: function(element) {
            var root = element.childNodes[1].firstChild
            var data = (root.nodeName == "svg") ? root.outerHTML : root.innerHTML;
            const head = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" version="1.2"'
            // TODO, preferably we would use DOM for this.
            data = head + data.substring(4).replace(/currentColor/g, this.cTextColor).replace(/style="/, "style=\"background-color:"+this.cBkgColor+";")
            return data
        },
        renderSVG: async function(callback) {
            // TODO sleeping is a dirty fix to give MathJax time to set the renderer. This could probably be done more rigorously.
            // This is also done for PNG.
            var oldJaxRenderer = this.getJaxRenderer()
            MathJax.Hub.setRenderer("SVG")
            await sleep(200)

            var element = document.createElement("DIV")
            element.innerHTML = this.getPrerender();
            MathJax.Hub.Typeset(element, function() {
                MathJax.Hub.setRenderer(oldJaxRenderer)
                callback(app.getSVG(element))
            });
        },
        renderPNG: async function(callback) {
            var oldJaxRenderer = this.getJaxRenderer()
            MathJax.Hub.setRenderer("SVG")
            await sleep(200)

            var element = document.createElement("DIV")
            element.innerHTML = this.getPrerender();
            MathJax.Hub.Typeset(element, function() {
                MathJax.Hub.setRenderer(oldJaxRenderer)

                // Get the aspect ratio
                var root = element.childNodes[1].firstChild
                root = (root.nodeName == "svg") ? root:root.firstChild;

                var width = parseFloat(root.getAttribute("width").replace(/ex/,"")),
                    height = parseFloat(root.getAttribute("height").replace(/ex/,"")),
                    scale = 128;

                // See https://stackoverflow.com/questions/5433806/convert-embedded-svg-to-png-in-place
                var svgData = app.getSVG(element),
                    can = document.createElement('canvas'),
                    ctx = can.getContext("2d"),
                    loader = new Image;
                
                loader.width = can.width = scale*width//TARGET. Needs to be computed.
                loader.height = can.height = scale*height//TARGET. ----------=---------
                loader.onload = function() {
                    ctx.drawImage(loader, 0, 0, loader.width, loader.height);
                    callback(can.toDataURL())
                }
                loader.src = 'data:image/svg+xml,' + encodeURIComponent( svgData );
            })
        },
    },
})

/*
async function clipboardPNG(evt) {
    console.log("EVENT")
    //app.renderPNG(function(data) {window.open(data)})
    app.renderPNG(dataToClipboard)
}
async function dataToClipboard(data) {
    if (!navigator.clipboard) {
        alert("Your browser is too old.")
        return
    }
    try {
        await navigator.clipboard.writeText(data)
    } catch (err) {
        console.error('Failed to copy!', err)
    }
}
*/

// TODO rename
getQuery = function(key) {
    if(location.href.includes("#!") && location.href.includes(key + "=")) {
        return location.href.split("#!")[1].split(key + "=")[1].split("&")[0]
    } else {
        return false
    }
}

linkToClipboard = async function (event) {
    if (!navigator.clipboard) {
        alert("Your browser is too old.")
        return
    }
    try {
        await navigator.clipboard.writeText([app.getLink()])
    } catch (err) {
        console.error('Failed to copy!', err)
    }
}

// Should be called with "await"
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
  }

function fetchJSONFile(path, callback) {
var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === 4) {
            if (httpRequest.status === 200) {
                var data = JSON.parse(httpRequest.responseText);
                if (callback) callback(data);
            }
        }
    };
    httpRequest.open('GET', path);
    httpRequest.send(); 
}

// Has to be done before the body onload below due to theme and toolbox loading
fetchJSONFile("themes.json", function(groupedthemes) {
    for (var groupkey in groupedthemes) {
        for (var themekey in groupedthemes[groupkey]) {
            app.themes[themekey] = groupedthemes[groupkey][themekey]
        }
    }
    app.groupedthemes = groupedthemes
})

fetchJSONFile("toolboxes.json", function(groupedtoolboxes) {
    app.groupedtoolboxes = groupedtoolboxes
})

document.body.onload = function() {
    try {
        var inputty_b64_encoded = getQuery("base64")
        var inputty_utf8_encoded = getQuery("b64_utf8")
        var theme = getQuery("theme")
        var toolbox = getQuery("toolbox")
        var inputMode = getQuery("inputmode")
        if(inputty_b64_encoded) {
            var inputty_decoded = atob(decodeURI(inputty_b64_encoded))
            app.inputty = inputty_decoded
            app.render()
        } else if(inputty_utf8_encoded) {
            var dec = new TextDecoder("utf-8")
            var buffer = new Uint8Array(atob(decodeURI(inputty_utf8_encoded)).split(",").map(parseFloat))
            var inputty_decoded = dec.decode(buffer)
            app.inputty = inputty_decoded
            app.render()
        }
        if(theme && app.themes.hasOwnProperty(theme)) {
            app.theme = theme
            app.updateTheme()
        } else if(theme && theme[6]=="-") {
            app.theme = "custom"
            theme = theme.replace(/\#/g, "")
            app.cTextColor = "#"+theme.substr(0,6)
            app.cBkgColor = "#"+theme.substr(7,6)
        }

        // TODO validate input
        if(toolbox)
            app.toolbox = toolbox
        if(inputMode) {
            app.mathInput = inputMode
            app.render()
        }
    } finally {

    }
}