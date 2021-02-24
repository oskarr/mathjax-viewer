var app = new Vue({
    el: "#app",
    data: {
        theme: "default",
        inputty: "",
        autorender: true,

        cBkgColor: "#333333",
        cTextColor: "#cccccc",
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
            if (e.which == 13 || this.autorender)
                this.render()
        },
        render: function(force = false) {
            document.getElementById("putty").innerHTML = "\\[" + this.inputty + "\\]";
            MathJax.Hub.Typeset();
        },
        updateTheme: function() {
            this.cTextColor = this.themes[this.theme].text;
            this.cBkgColor = this.themes[this.theme].bg;
            if("border" in this.themes[this.theme]) {
                this.cBorder = this.themes[this.theme].border;
            } else {this.cBorder = "";}
        }
    },
})