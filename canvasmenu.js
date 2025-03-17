import { hexToRGB } from "common-helpers";

let cmoCan = null;
let cmoCon = null;
let cmoIcons = {};

let firstFluent = true;

export class CanvasMenu {
    constructor(options) {
        this.size = options.size || 320;
        this.scale = options.scale || 1;

        this.scaledSize = this.size * this.scale;


        this.canvas = null;

        if(options.canvas) {
            this.canvas = options.canvas;
        } else {
            this.canvas = document.createElement("canvas");
            this.canvas.width = this.scaledSize;
            this.canvas.height = this.scaledSize;
        }

        this.context = this.canvas.getContext("2d");

        this.context.msImageSmoothingEnabled = false;
        this.context.mozImageSmoothingEnabled = false;
        this.context.webkitImageSmoothingEnabled = false;
        this.context.imageSmoothingEnabled = false;

        this.canvas.style.imageRendering = "pixelated";

        this.updateCallback = options.onUpdated || null;
        this.onPadSelectionCallback = options.onPadSelection || null;

        this.font = options.font || "Open Sans, OpenSans, Gudea, sans-serif";

        this.cancelText = options.cancelText || "Cancel";
        this.confirmText = options.confirmText || "Confirm";

        this.title = options.title || null;
        this.titleLogo = options.titleLogo || null;
        this.options = options.options || [];
        this.onSelection = options.onSelection || null;

        this.padIndex = -1;
        this.listIndex = options.index || 0;

        this.showCursor = options.showCursor || true;

        this.footer = options.footer || null;
        this.subFooter = options.subFooter || null;

        this.subFooterFunction = options.subFooterFunction || null;

        this.itemPadding = options.itemPadding || 1;

        this.style = options.style || "menu";

        if(this.style == "absolute") {
            this.padIndex = null;
        }

        for(let i = 0; i < this.options.length; i++) {
            const opt = this.options[i];

            if(opt.tag && opt.highlighted) {
                if(this.style == "absolute") {
                    this.padIndex = opt;
                } else {
                    this.padIndex = i;
                }
            }
        }

        this.theme = options.theme || "#1E88E5";
        this.listItemPadding = options.listItemPadding || 48;

        this.scrollPos = 0;

        this.hoverX = -1;
        this.hoverY = -1;

        this.cashed = false;
        this.isClicking = false;

        const menu = this;

        this.canvas.addEventListener("pointermove", function(e) {
            menu.setHover(e.offsetX, e.offsetY);
        });

        this.canvas.addEventListener("pointerdown", function() {
            menu.isClicking = true;
            renderCanvasMenu(menu);
        });

        this.canvas.addEventListener("pointerup", function() {
            menu.isClicking = false;
        });

        renderCanvasMenu(this);
    }

    setHover(ux, uy) {
        const x = Math.round(ux);
        const y = Math.round(uy);

        if(x == this.hoverX && y == this.hoverY) {
            return;
        }

        this.hoverX = x;
        this.hoverY = y;

        this.padIndex = -1;

        renderCanvasMenu(this);
    }

    setHoverAsRatio(rx, ry) {
        const ux = rx * this.scaledSize;
        const uy = ry * this.scaledSize;

        const x = Math.round(ux);
        const y = Math.round(uy);

        if(x == this.hoverX && y == this.hoverY) {
            return;
        }

        this.hoverX = x;
        this.hoverY = y;

        this.padIndex = -1;

        renderCanvasMenu(this);
    }

    setClickingAtRatio(rx, ry) {
        this.isClicking = true;

        const ux = rx * this.scaledSize;
        const uy = ry * this.scaledSize;

        const x = Math.round(ux);
        const y = Math.round(uy);

        this.hoverX = x;
        this.hoverY = y;

        this.padIndex = -1;

        renderCanvasMenu(this);

        this.isClicking = false;
    }

    setClickingAtCurrent() {
        this.isClicking = true;

        this.padIndex = -1;

        renderCanvasMenu(this);

        this.isClicking = false;
    }

    render() {
        renderCanvasMenu(this);
    }

    onPadDown() {}
}

function renderCanvasMenu(menu) {
    if(!menu || !menu.canvas || !menu.context) {
        return;
    }

    if(menu.cashed) {
        return;
    }

    const context = menu.context;

    if(menu.style == "title" || menu.style == "menu") {
        renderStandardCanvasMenu(menu, context);
    }

    if(menu.style == "absolute") {
        renderAbsoluteCanvasMenu(menu, context);
    }

    if(menu.style == "list") {
        renderListCanvasMenu(menu, context);
    }

    if(menu.showCursor && menu.hoverX > 0 && menu.hoverY > 0) {
        context.fillStyle = "rgba(255,255,255,0.75)";
        context.beginPath();
        context.arc(menu.hoverX, menu.hoverY, 4 * menu.scale, 0, 2 * Math.PI);
        context.fill();

        context.strokeStyle = "rgba(0,0,0,0.9)";
        context.lineWidth = 2 * menu.scale;

        context.beginPath();
        context.arc(menu.hoverX, menu.hoverY, 4 * menu.scale, 0, 2 * Math.PI);
        context.stroke();
    }

    if(menu.updateCallback) {
        menu.updateCallback();
    }
}

function renderStandardCanvasMenu(menu, context) {
    let w = menu.canvas.width;
    let h = menu.canvas.height;

    context.clearRect(0,0,w,h);

    context.font = "bold " + 24 * menu.scale + "px " + menu.font;
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#000000";
    context.textBaseline = "top";
    context.lineWidth = 4 * menu.scale;
    context.textAlign = "left";

    context.lineJoin = "miter";
    context.miterLimit = 2;
    context.lineCap = "round";

    const padding = 12 * menu.scale;
    let menuTop = padding;

    let currentY = renderStandardMenuTitle(menu, context, padding, w);

    currentY += 8 * menu.scale;

    for(let i = 0; i < menu.options.length; i++) {
        const option = menu.options[i];
        currentY = renderMenuItem(option,menu,currentY,menuTop,i);
        currentY += 8 * menu.scale;
    }


    if(menu.footer) {
        context.font = "bold " + 14 * menu.scale + "px " + menu.font;
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#000000";
        context.textBaseline = "bottom";

        context.textAlign = "center";

        const dx = Math.round(w / 2);

        context.fillText(menu.footer, dx, h - (6 * menu.scale));
        context.strokeText(menu.footer, dx, h - (6 * menu.scale));
        context.fillText(menu.footer, dx, h - (6 * menu.scale));
    }

    if(menu.subFooter) {
        context.font = "bold " + 10 * menu.scale + "px " + menu.font;
        context.fillStyle = "#ffffff";

        if(menu.subFooterFunction && menu.hoverY > h - (36 * menu.scale)) {
            context.fillStyle = menu.theme;

            if(menu.isClicking) {
                menu.subFooterFunction();
                menu.isClicking = false;
            }
        }

        context.strokeStyle = "#000000";
        context.textBaseline = "bottom";

        context.textAlign = "center";

        const dx = Math.round(w / 2);

        context.fillText(menu.subFooter, dx, h - (26 * menu.scale));
        context.strokeText(menu.subFooter, dx, h - (26 * menu.scale));
        context.fillText(menu.subFooter, dx, h - (26 * menu.scale));

        
    }
}

function renderAbsoluteCanvasMenu(menu, context) {
    let w = menu.canvas.width;
    let h = menu.canvas.height;

    context.clearRect(0,0,w,h);

    const padding = 12 * menu.scale;

    if(menu.titleLogo) {
        const logoImg = cmoIcons[menu.titleLogo];

        if(logoImg) {
            if(logoImg.loaded) {
                const dh = Math.round(32 * menu.scale);

                const dScale = dh / logoImg.icon.height;
                
                const dw = Math.round(logoImg.icon.width * dScale);

                context.drawImage(logoImg.icon,padding, padding, dw, dh);
            
            } else {
                setTimeout(function(){
                    renderCanvasMenu(menu);
                },500);

                return;
            }
        } else {
            cmoIcons[menu.titleLogo] = {
                icon: null,
                loaded: false
            };

            const im = new Image();
            im.onload = function() {
                cmoIcons[menu.titleLogo].loaded = true;

                renderCanvasMenu(menu);
            };
            im.src = menu.titleLogo;

            cmoIcons[menu.titleLogo].icon = im;

            return;
        }
    }

    for(let i = 0; i < menu.options.length; i++) {
        const option = menu.options[i];
        renderAbsoluteMenuItem(option, menu);
    }
}

function renderListCanvasMenu(menu, context) {

    let w = menu.canvas.width;
    let h = menu.canvas.height;

    context.clearRect(0,0,w,h);

    context.font = "bold " + 24 * menu.scale + "px " + menu.font;
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#000000";
    context.textBaseline = "top";
    context.lineWidth = 4 * menu.scale;
    context.textAlign = "left";

    context.lineJoin = "miter";
    context.miterLimit = 2;
    context.lineCap = "round";

    const padding = 12 * menu.scale;

    let currentY = renderStandardMenuTitle(menu, context, padding, w);

    currentY += menu.listItemPadding * menu.scale;

    let leftRightButtonY = Math.floor((currentY + (9 * menu.scale)) / menu.scale);

    let curItem = menu.options[menu.listIndex];

    if(!curItem) {
        curItem = menu.options[0];
        menu.listIndex = 0;
    }

    let fontSize = 18;

    context.font = "bold " + fontSize * menu.scale + "px " + menu.font;

    context.fillStyle = "#ffffff";
    context.strokeStyle = "#000000";

    const measureSize = fontSize + 2;

    let titleX = 48 * menu.scale;
    let measurement = measureSize * menu.scale;

    if(curItem) {
        if(curItem.title) {
            context.fillText(curItem.title, titleX, currentY);
            context.strokeText(curItem.title, titleX, currentY);
            context.fillText(curItem.title, titleX, currentY);


            currentY += (measurement + (4 * menu.scale));
        }

        if(curItem.description) {
            fontSize = 12;

            context.font = "bold " + fontSize * menu.scale + "px " + menu.font;
            context.fillStyle = "#ffffff";
            context.strokeStyle = "#000000";
            context.textBaseline = "top";
            context.lineWidth = 4 * menu.scale;

            const maxWidth = w - ((titleX * 2) + (padding * 2));

            let lines = wrapText(context, curItem.description, titleX, currentY, maxWidth, 12 * menu.scale);

            currentY += (lines * fontSize * menu.scale);
        }

        if(curItem.status) {

            fontSize = 12;

            currentY += 6 * menu.scale;

            context.font = "bold " + fontSize * menu.scale + "px " + menu.font;

            if(curItem.statusColor) {
                context.fillStyle = curItem.statusColor;
            } else {
                context.fillStyle = "#ffffff";
            }

            
            context.strokeStyle = "#000000";
            context.textBaseline = "top";
            context.lineWidth = 4 * menu.scale;

            context.fillText(curItem.status, titleX, currentY);
            context.strokeText(curItem.status, titleX, currentY);
            context.fillText(curItem.status, titleX, currentY);


            currentY += (measurement + (4 * menu.scale));
        }

        if(curItem.rating) {

            fontSize = 12;

            //currentY += 6 * menu.scale;

            context.font = "bold " + fontSize * menu.scale + "px fluent";

            context.fillStyle = "#FFC107";
            context.strokeStyle = "#000000";
            context.textBaseline = "top";
            context.lineWidth = 4 * menu.scale;

            let ratingText = "";

            for(let r = 1; r <= 5; r++) {
                if(curItem.rating >= r) {
                    ratingText += String.fromCharCode("0xE00A");
                } else {
                    if(curItem.rating >= r - 0.5) {
                        ratingText += String.fromCharCode("0xF0E7");
                    } else {
                        ratingText += String.fromCharCode("0xE1CE");
                    }
                }

                ratingText += " ";
            }

            context.fillText(ratingText, titleX, currentY);
            context.strokeText(ratingText, titleX, currentY);
            context.fillText(ratingText, titleX, currentY);


            currentY += (measurement + (4 * menu.scale));
        }

        if(curItem.userCard) {

            console.log("draw avatar icon here at some point?");

            fontSize = 12;

            currentY += 6 * menu.scale;

            context.font = "bold " + fontSize * menu.scale + "px " + menu.font;

            context.fillStyle = "#ffffff";
            context.strokeStyle = "#000000";
            context.textBaseline = "top";
            context.lineWidth = 4 * menu.scale;

            context.fillText(curItem.userCard, titleX, currentY);
            context.strokeText(curItem.userCard, titleX, currentY);
            context.fillText(curItem.userCard, titleX, currentY);


            currentY += (measurement + (4 * menu.scale));
        }
    }

    if(menu.options.length > 1) {

        let leftColor = "#4CAF50";
        let rightColor = "#4CAF50";

        if(menu.listIndex == 0) {
            leftColor = "#F44336";
        }

        if(menu.listIndex == menu.options.length - 1) {
            rightColor = "#F44336";
        }

        renderAbsoluteMenuItem({
            icon: "fluent.&#xEDD5;",
            iconColor: leftColor,
            top: leftRightButtonY,
            left: 12,
            tag: "prev",
            overrideCallback: function() {
                menu.listIndex--;
                
                if(menu.listIndex < 0) {
                    menu.listIndex = menu.options.length - 1;
                }

                renderListCanvasMenu(menu, context);
                menu.updateCallback();
            }
        }, menu);

        renderAbsoluteMenuItem({
            icon: "fluent.&#xEDD6;",
            iconColor: rightColor,
            top: leftRightButtonY,
            right: 12,
            tag: "next",
            overrideCallback: function() {
                menu.listIndex++;
                
                if(menu.listIndex >= menu.options.length) {
                    menu.listIndex = 0;
                }

                renderListCanvasMenu(menu, context);
                menu.updateCallback();
            }
        }, menu);

        renderAbsoluteMenuItem({
            text: menu.cancelText,
            icon: "fluent.&#xEA39;",
            iconColor: "#F44336",
            bottom: 12,
            left: 12,
            tag: null,
            overrideCallback: function() {
                menu.onSelection(null);
            }
        }, menu);

        renderAbsoluteMenuItem({
            text: menu.confirmText,
            icon: "fluent.&#xE930;",
            iconColor: "#4CAF50",
            bottom: 12,
            right: 12,
            tag: "confirm",
            overrideCallback: function() {
                menu.onSelection(curItem.tag);
            }
        }, menu);

    }
}

function renderStandardMenuTitle(menu, context, padding, w) {
    let currentY = padding;
    
    if(menu.titleLogo) {
        const logoImg = cmoIcons[menu.titleLogo];

        if(logoImg) {
            if(logoImg.loaded) {
                const dw = Math.round(w * 0.9);
                const dx = Math.round((w / 2) - (dw / 2));

                const dScale = dw / logoImg.icon.width;
                
                const dh = Math.round(logoImg.icon.height * dScale);

                context.drawImage(logoImg.icon,dx, currentY, dw, dh);
                
                currentY += dh;
            } else {
                setTimeout(function(){
                    renderCanvasMenu(menu);
                },500);

                return;
            }
        } else {
            cmoIcons[menu.titleLogo] = {
                icon: null,
                loaded: false
            };

            const im = new Image();
            im.onload = function() {
                cmoIcons[menu.titleLogo].loaded = true;

                renderCanvasMenu(menu);
            };
            im.src = menu.titleLogo;

            cmoIcons[menu.titleLogo].icon = im;

            return;
        }
    } else {
        if(menu.title) {
            
            context.font = "bold " + 24 * menu.scale + "px " + menu.font;

            let measurement = context.measureText(menu.title);

            const dx = Math.round((w / 2) - (measurement.width / 2));

            

            context.fillStyle = menu.theme;
            context.strokeStyle = "#000000";

            context.fillText(menu.title, dx, currentY);
            context.strokeText(menu.title, dx, currentY);
            context.fillText(menu.title, dx, currentY);

            //let height = measurement.height;

            let height = 24 * menu.scale;

            currentY += (height + padding);
        }
    }

    return currentY;
}

function renderMenuItem(option, menu, currentY, menuTop, idx) {
    if(!cmoCan || !cmoCon) {
        cmoCan = document.createElement("canvas");
        cmoCon = cmoCan.getContext("2d");
    }

    let fluentRedraw = false;

    let w = menu.canvas.width;

    const context = menu.context;

    cmoCan.width = w;
    cmoCan.height = 600;

    const padding = menu.itemPadding * menu.scale;

    cmoCon.lineJoin = "miter"; // Experiment with "bevel" & "round" for the effect you want!
    cmoCon.miterLimit = 2;
    cmoCan.lineCap = "round";

    let itemTextX = padding;
    let icnSize = 0;

    let fontSize = 16;

    if(option.icon && menu.style == "menu") {
        itemTextX = (32 * menu.scale) + (padding * 2);

        if(option.compactItem) {
            itemTextX = (18 * menu.scale) + (padding * 8);
        }

        if(option.icon.indexOf("fluent.") == 0) {

            itemTextX += (padding * 2);

            if(firstFluent) {
                firstFluent = false;
                fluentRedraw = true;
            }

            let useIcon =  String.fromCharCode("0x" + option.icon.replace("fluent.&#x","").replace(";",""));

            if(option.compactItem) {
                cmoCon.font = "bold " + 18 * menu.scale + "px fluent";
            } else {
                cmoCon.font = "bold " + 32 * menu.scale + "px fluent";
            }
            
            if(option.iconColor) {
                cmoCon.fillStyle = option.iconColor;
            } else {
                cmoCon.fillStyle = "#ffffff";
            }
            
            cmoCon.strokeStyle = "#000000";
            cmoCon.textBaseline = "top";
            cmoCon.lineWidth = 4 * menu.scale;

            const iconArea = 2 * menu.scale;
            const pos = iconArea + padding;

            cmoCon.fillText(useIcon, pos, pos);
            cmoCon.strokeText(useIcon, pos, pos);
            cmoCon.fillText(useIcon, pos, pos);
        }

        if(option.icon.indexOf("data:") == 0 || option.icon.indexOf("https://") == 0 || option.icon.endsWith(".png") || option.icon.endsWith(".jpg") || option.icon.endsWith(".svg")) {
            if(cmoIcons[option.icon]) {
                if(cmoIcons[option.icon].loaded) {

                    icnSize = 32 * menu.scale;

                    if(option.compactItem) {
                        icnSize = 18 * menu.scale;
                    }

                    cmoCon.globalAlpha = 1;

                    cmoCon.globalCompositeOperation = "source-over";

                    cmoCon.drawImage(cmoIcons[option.icon].icon,padding,padding,icnSize,icnSize);

                    if(option.circleIcon) {
                        cmoCon.globalCompositeOperation = "destination-in";

                        let halfIcn = icnSize / 2;

                        cmoCon.fillStyle = "#000000";

                        cmoCon.beginPath();
                        cmoCon.arc(padding + halfIcn, padding + halfIcn, halfIcn, 0, 2 * Math.PI);
                        cmoCon.fill();
                    }

                    cmoCon.globalCompositeOperation = "source-over";
                }
            } else {
                cmoIcons[option.icon] = {
                    icon: null,
                    loaded: false
                };

                let im = new Image();
                im.onload = function() {
                    cmoIcons[option.icon].loaded = true;

                    if(menu.updateCallback) {
                        renderCanvasMenu(menu);
                        menu.updateCallback();
                    }
                };
                im.crossOrigin = "anonymous";
                im.src = option.icon;

                cmoIcons[option.icon].icon = im;
            }
        }
    }

    let itemY = padding;

    const measureSize = fontSize + 2;
    
   

    cmoCon.font = "bold " + fontSize * menu.scale + "px " + menu.font;
    cmoCon.textAlign = "left";
    cmoCon.fillStyle = "#ffffff";

    let titleX = itemTextX;
    let measurement = measureSize * menu.scale;

    if(menu.style == "title") {
        let titleFontSize = 20;
    
        if(option.fontSize) {
            titleFontSize = option.fontSize;
        }

        let titleMeasureSize = titleFontSize + 2;

        cmoCon.textAlign = "center";
        measurement = titleMeasureSize * menu.scale;
        cmoCon.font = "bold " + titleFontSize * menu.scale + "px " + menu.font;
        titleX = Math.round(w / 2);

        if(idx == menu.padIndex || (menu.hoverY > currentY && menu.hoverY < currentY + measurement)) {
            cmoCon.fillStyle = menu.theme;
        }
    }

    
    
    cmoCon.strokeStyle = "#000000";
    cmoCon.textBaseline = "top";
    cmoCon.lineWidth = 4 * menu.scale; 

    

    if(option.title) {
        
        cmoCon.fillText(option.title, titleX, itemY);
        cmoCon.strokeText(option.title, titleX, itemY);
        cmoCon.fillText(option.title, titleX, itemY);


        itemY += (measurement + (4 * menu.scale));
    }

    if(option.description) {
        cmoCon.font = "bold " + 12 * menu.scale + "px " + menu.font;
        cmoCon.fillStyle = "#ffffff";
        cmoCon.strokeStyle = "#000000";
        cmoCon.textBaseline = "top";
        cmoCon.lineWidth = 4 * menu.scale;

        let lines = wrapText(cmoCon, option.description, itemTextX, itemY, w - (icnSize + (padding * 2)), 12 * menu.scale);

        itemY += (lines * 12 * menu.scale);
    }


    if(option.progress) {
        cmoCon.lineWidth = 1 * menu.scale;

        itemY += 6 * menu.scale;

        let prgWidth = (w - (padding * 2)) * (option.progress / 100);

        cmoCon.fillStyle = menu.theme;

        let prgHeight = 12 * menu.scale;

        cmoCon.fillRect(padding,itemY,prgWidth,prgHeight);

        cmoCan.strokeStyle = "#000000";
        cmoCon.strokeRect(padding,itemY,(w - (padding * 2)),prgHeight);

        itemY += 12 * menu.scale;
    }

    cmoCon.lineWidth = 4 * menu.scale;

    if(option.status) {

        itemY += 6 * menu.scale;

        cmoCon.font = "bold " + 14 * menu.scale + "px " + menu.font;

        if(option.statusColor) {
            cmoCon.fillStyle = option.statusColor;
        } else {
            cmoCon.fillStyle = "#ffffff";
        }

        
        cmoCon.strokeStyle = "#000000";
        cmoCon.textBaseline = "top";
        cmoCon.lineWidth = 4 * menu.scale;

        let lines = wrapText(cmoCon, option.status, itemTextX, itemY, w - (icnSize + (padding * 2)), 14 * menu.scale);

        itemY += (lines * 14 * menu.scale);
    }


    // will need to take scroll offset into account
    let itemDrawY = currentY;

    if(menu.hoverY > itemDrawY && menu.hoverY < itemDrawY + itemY) {
        menu.padIndex = idx;
    }

    if(idx == menu.padIndex) {

        menu.padIndex = idx;
       
        if(menu.style == "menu") {
            let rgb = hexToOffset(menu.theme, 0);

            context.fillStyle = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + ",0.5)";

            context.beginPath();

            if(context.roundRect) {
                context.roundRect(0, currentY, w, itemY + padding, 6 * padding);
            } else {
                context.rect(0, currentY, w, itemY + padding, 6 * padding);
            }

            context.fill();
        }
        

        if(menu.isClicking) {

            menu.onSelection(option.tag);
            menu.isClicking = false;
        }
    }

    context.drawImage(cmoCan, 0, currentY);

    if(fluentRedraw) {
        setTimeout(function() {
            renderCanvasMenu(menu);
            menu.updateCallback();
        }, 500);
    }

    return currentY + itemY;
}

function renderAbsoluteMenuItem(option, menu) {

    if(option.type && option.type == "image") {
        renderImageMenuItem(option, menu);
    }

    if(!cmoCan || !cmoCon) {
        cmoCan = document.createElement("canvas");
        cmoCon = cmoCan.getContext("2d");
    }

    cmoCon.clearRect(0, 0, cmoCan.width, cmoCan.height);

    let fluentRedraw = false;

    cmoCon.lineJoin = "miter";
    cmoCon.miterLimit = 2;
    cmoCon.lineCap = "round";

    let dx = 0;
    let dy = 0;

    const w = menu.canvas.width;
    const h = menu.canvas.height;

    const context = menu.context;

    let fontSize = 14;
    let opacity = 1;
    let align = "left";

    if(option.fontSize) {
        fontSize = option.fontSize;
    }

    if(option.opacity) {
        opacity = option.opacity;
    }

    if(option.align) {
        align = option.align;
    }

    cmoCan.width = w;
    cmoCan.height = 600;

    let optionWidth = 0;
    let optionHeight = 0;

    if(option.text) {
        cmoCon.font = "bold " + fontSize * menu.scale + "px " + menu.font;
        optionWidth += cmoCon.measureText(option.text).width;
        
        
        optionHeight = 18 * menu.scale;
    }

    const padding = menu.itemPadding * menu.scale;

    let txX = padding;
    let txY = padding;

    if(option.icon) {

        let icnSize = 26;

        if(option.iconSize) {
            icnSize = option.iconSize + 7;
        }

        optionWidth += icnSize * menu.scale;
        optionHeight = 22 * menu.scale;
    }

    if(option.top) {
        dy = (option.top * menu.scale);
    }

    if(option.left) {
        dx = (option.left * menu.scale);

        if(align == "center") {
            dx -= optionWidth / 2;
        }
    }

    if(option.right) {
        dx = w - ((option.right * menu.scale) + optionWidth);

        if(align == "center") {
            dx += optionWidth / 2;
        }
    }

    if(option.bottom) {
        dy = h - ((option.bottom * menu.scale) + optionHeight);
    }

    if(option.icon) {
        if(option.icon.indexOf("fluent.") == 0) {
            if(firstFluent) {
                firstFluent = false;
                fluentRedraw = true;
            }

            const useIcon = String.fromCharCode("0x" + option.icon.replace("fluent.&#x","").replace(";",""));
            cmoCon.font = "bold " + ((fontSize + 2) * menu.scale) + "px fluent";

            if(option.iconColor) {
                cmoCon.fillStyle = option.iconColor;
            } else {
                cmoCon.fillStyle = "#ffffff";
            }

            cmoCon.strokeStyle = "#000000";

            if(option.tag) {

                if(menu.hoverX > dx && menu.hoverY > dy && menu.hoverX < dx + optionWidth && menu.hoverY < dy + optionHeight) {
                    menu.padIndex = option;
                }

                if(menu.padIndex && menu.padIndex == option) {
                    cmoCon.fillStyle = menu.theme;
                }
            }

            cmoCon.textBaseline = "top";
            cmoCon.lineWidth = 3 * menu.scale;

            cmoCon.lineJoin = "miter";
            cmoCon.miterLimit = 2;
            cmoCan.lineCap = "round";

            const ix = Math.round(padding + (2 * menu.scale));

            cmoCon.fillText(useIcon, ix, ix);
            cmoCon.strokeText(useIcon, ix, ix);
            cmoCon.fillText(useIcon, ix, ix);

            txX += 26 * menu.scale;
        }

        if(option.icon.indexOf("data:") == 0 || option.icon.indexOf("https://") == 0 || option.icon.endsWith(".png") || option.icon.endsWith(".jpg") || option.icon.endsWith(".svg")) {

            let baseIconSize = fontSize + 3;
            

            if(option.iconSize) {
                baseIconSize = option.iconSize;
            }

            let icnSize = baseIconSize * menu.scale;

            if(cmoIcons[option.icon]) {
                if(cmoIcons[option.icon].loaded) {

                    

                    cmoCon.globalAlpha = 1;

                    if(option.tag) {

                        if(menu.hoverX > dx && menu.hoverY > dy && menu.hoverX < dx + optionWidth && menu.hoverY < dy + optionHeight) {
                            menu.padIndex = option;
                        }
    
                        if(menu.padIndex && menu.padIndex == option) {
                            cmoCon.globalAlpha = 0.5;

                            if(!option.text) {
                                dx -= (3 * menu.scale);
                                dy -= (3 * menu.scale);

                                baseIconSize += 6;
                                icnSize = baseIconSize * menu.scale;
                            }
                        }
                    }

                    cmoCon.globalCompositeOperation = "source-over";

                    const ix = Math.round(padding + (2 * menu.scale));

                    cmoCon.drawImage(cmoIcons[option.icon].icon,ix,ix,icnSize,icnSize);

                    if(option.circleIcon) {
                        cmoCon.globalCompositeOperation = "destination-in";

                        const halfIcn = icnSize / 2;

                        cmoCon.fillStyle = "#000000";

                        cmoCon.beginPath();
                        cmoCon.arc(ix + halfIcn, ix + halfIcn, halfIcn, 0, 2 * Math.PI);
                        cmoCon.fill();
                    }

                    cmoCon.globalCompositeOperation = "source-over";
                    cmoCon.globalAlpha = 1;
                }
            } else {
                cmoIcons[option.icon] = {
                    icon: null,
                    loaded: false
                };

                let im = new Image();
                im.onload = function() {
                    cmoIcons[option.icon].loaded = true;

                    if(menu.updateCallback) {
                        renderCanvasMenu(menu);
                        menu.updateCallback();
                    }
                };
                im.crossOrigin = "anonymous";
                im.src = option.icon;

                cmoIcons[option.icon].icon = im;
            }

            txX += (baseIconSize + 7) * menu.scale;
        }

        
        txY += 4 * menu.scale;
    }
    

    cmoCon.font = "bold " + fontSize * menu.scale + "px " + menu.font;
    cmoCon.strokeStyle = "#000000";
    cmoCon.fillStyle = "#ffffff";

    if(option.color) {
        cmoCon.fillStyle = option.color;
    }

    if(option.tag || option.overrideCallback) {
        if(menu.hoverX > dx && menu.hoverY > dy && menu.hoverX < dx + optionWidth && menu.hoverY < dy + optionHeight) {
            menu.padIndex = option;
        }

        if(menu.padIndex && menu.padIndex == option) {

            cmoCon.fillStyle = menu.theme;

            if(menu.isClicking) {

                menu.isClicking = false;

                if(option.overrideCallback) {
                    option.overrideCallback(option.tag);
                } else {
                    menu.onSelection(option.tag);
                }

                
                
            }
        }
    }
    

    cmoCon.textBaseline = "top";
    cmoCon.lineWidth = 3 * menu.scale; 

    cmoCon.lineJoin = "miter";
    cmoCon.miterLimit = 2;
    cmoCan.lineCap = "round";

    txX = Math.round(txX);
    txY = Math.round(txY);

    if(option.text) {

        if(option.multiline) {

            const maxWidth = Math.floor(cmoCan.width - (txX * 2));

            wrapText(cmoCon, option.text, txX, txY, maxWidth, 18 * menu.scale);
        } else {
            cmoCon.fillText(option.text, txX, txY);

            if(!option.noStroke) {
                cmoCon.strokeText(option.text, txX, txY);
                cmoCon.fillText(option.text, txX, txY);
            }
        }
        
        
    }

    

    if(opacity && opacity < 1) {
        context.save();
        context.globalAlpha = opacity;
    }

    context.drawImage(cmoCan, Math.round(dx), Math.round(dy));

    if(opacity && opacity < 1) {
        context.restore();
    }

    option.renderPos = {
        x: dx,
        y: dy,
        w: optionWidth,
        h: optionHeight,
        rx: dx + optionWidth,
        by: dy + optionHeight
    };

    if(fluentRedraw) {

        setTimeout(function() {

            renderCanvasMenu(menu);
            menu.updateCallback();
        }, 500);
    }
}

export function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";

    let lines = 1;

    for (const [index, w] of words.entries()) {
        const testLine = line + w + " ";
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > maxWidth && index > 0) {

            ctx.fillText(line, x, y);
            ctx.strokeText(line, x, y);
            ctx.fillText(line, x, y);

            line = w + " ";
            y += lineHeight;
            lines++;
        } else {
            line = testLine;
        }
    }


    ctx.fillText(line, x, y);
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);

    return lines;
}

export function hexToOffset(hex, offset) {
    let color = hexToRGB(hex);

    color.r += offset;
    color.g += offset;
    color.b += offset;

    if (offset > 0) {
        if (color.r > 255) {
            color.r = 255;
        }

        if (color.g > 255) {
            color.g = 255;
        }

        if (color.b > 255) {
            color.b = 255;
        }
    } else {
        if (color.r < 0) {
            color.r = 0;
        }

        if (color.g < 0) {
            color.g = 0;
        }

        if (color.b < 0) {
            color.b = 0;
        }
    }

    return color;
}

function renderImageMenuItem(option, menu) {
    const context = menu.context;
    const img = cmoIcons[option.src];

    if(img) {
        if(img.loaded) {
            const dh = Math.round(option.height * menu.scale);
            const dw = Math.round(option.width * menu.scale);

            const dx = Math.round(option.left * menu.scale);
            const dy = Math.round(option.top * menu.scale);

            context.drawImage(img.icon, dx, dy, dw, dh);
        } else {
            setTimeout(function(){
                renderCanvasMenu(menu);
            },500);

            return;
        }
    } else {
        cmoIcons[option.src] = {
            icon: null,
            loaded: false
        };

        const im = new Image();
        im.onload = function() {
            cmoIcons[option.src].loaded = true;

            renderCanvasMenu(menu);
        };
        im.src = option.src;

        cmoIcons[option.src].icon = im;
    }
}