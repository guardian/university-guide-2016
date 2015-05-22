export default class Animation {
    constructor(opts) {
        this.el = opts.el;
        this.animationEl = opts.el;

        if(!this.isMobile){
            this.animationEl.innerHTML = this.HTML;
            this.peopleAnimEl = this.el.querySelector('.ug16__anim--people')
            this.startAnimations();
        } else {
           this.animationEl.innerHTML = this.mobileHTML;
        }
    }

    get isMobile() {
        return window.innerWidth < 660;
    }

    get HTML() {
        return `
            <div class="ug16__animation-holder">
                <div class="ug16__anim ug16__anim--panels"></div>
                <div class="ug16__anim ug16__anim--skyline"></div>
                <div class="ug16__anim ug16__anim--bg"></div>
                <div class="ug16__anim ug16__anim--people"></div>
                <div class="ug16__anim ug16__anim--fg"></div>
            </div>`;
    }

    get mobileHTML() {
        return `<div class="static-image-holder"></div>`;
    }


    peopleAnimation() {
        this.peopleRef = (this.peopleRef - 450) % 1350;
        this.peopleAnimEl.style.backgroundPositionY = this.peopleRef + 'px'
    }

    startAnimation(fn, interval) {
        var raf = window.requestAnimationFrame || ( (fn) => window.setTimeout(fn, 1) );
        var animFn = raf.bind(window, fn);
        window.setInterval(animFn, interval)
    }

    startAnimations() {
        this.peopleRef = 0;
        this.startAnimation(this.peopleAnimation.bind(this), 150);
    }

}