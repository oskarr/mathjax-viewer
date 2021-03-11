var app = new Vue({
    el: "#app",
    data: {
        theme: "default",
        inputty: "",
        autorender: true,
        
        showCheatSheet: false,

        cTextColor: "#ffffff",
        cBkgColor: "#333333",
        cBorder: "",

        themes: {
            default: {
                text: "#ffffff",
                bg: "#333333",
            },
            light: {
                text: "#000000",
                bg: "#ffffff",
            },
            dark: {
                text: "#ffffff",
                bg: "#000000",
            },
            discord: {
                text: "#ffffff",
                bg: "#36393F",
                border: "unset",
            },
            fb_messenger: {
                text: "#000000", 
                bg: "#E4E6EB", //3E4042 for dark mode
            },
            solar_light: {
                text: "#073642", //586e75
                bg: "#fdf6e3",
            },
            slack_dark: {
                text: "#ffffff",
                bg: "#1a1d21",
            },
        }
    },
    methods: {
        inputCallback: function(e) {
            if (this.autorender || e.which == 13)
                this.render()
        },
        render: function(force = false) {
            document.getElementById("putty").innerHTML = "\\[" + this.inputty + "\\]";
            MathJax.Hub.Typeset();
        },
        updateTheme: function() {
            if(this.theme == "custom") {return}

            this.cTextColor = this.themes[this.theme].text;
            this.cBkgColor = this.themes[this.theme].bg;
            if("border" in this.themes[this.theme]) {
                this.cBorder = this.themes[this.theme].border;
            } else {this.cBorder = "";}
        },
        insertLaTeX: function(text, offset) {
            var offset = (typeof offset !== 'undefined') ?  offset : 0
            // will give the current postion of the cursor
            el = document.getElementById("inputty")
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
            return location.href.split("#!")[0] +
                "#!base64=" + encodeURI(btoa(this.inputty)) +
                "&theme=" + (this.theme=="custom" ? (this.cTextColor+"-"+this.cBkgColor):this.theme)
        },
        /*
        getSVG: function() {
            data = document.getElementById("putty").childNodes[1].firstChild.innerHTML
            head = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" version="1.2"'
            console.log(data)
            data = head + data.substring(4).replace(/currentColor/g, "#000")
            return data
        },
        downloadSVG: function() {
            download(this.getSVG(), "MathJax.svg", "image/svg+xml")
        }, */
    },
})

/*
clipboard = async function (event) {
    console.log("EVENT")
    if (!navigator.clipboard) {
        alert("Your browser is too old.")
        return
    }
    try {
        await navigator.clipboard.writeText([app.getSVG()])
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

document.body.onload = function() {
    try {
        var inputty_encoded = getQuery("base64")
        var theme = getQuery("theme")
        if(inputty_encoded) {
            var inputty_decoded = atob(decodeURI(inputty_encoded))
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
    } finally {

    }
}