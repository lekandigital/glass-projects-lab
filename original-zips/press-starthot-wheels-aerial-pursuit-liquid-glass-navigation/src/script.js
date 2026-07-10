let select = (e) => document.querySelector(e);
let selectAll = (e) => document.querySelectorAll(e);

const
gsapWrapper = select("#gsapWrapper"),
youTubePursuit1 = select("#youTubePursuit1"),
pursuit1 = select("#pursuit1"),
buttonW = select("#buttonW"),
button = select("#button"),
btRed = select("#btRed"),
btYellow = select("#btYellow"),
btWhite = select("#btWhite"),
btExit = select("#btExit"),
btLeft = select("#btLeft"),
btRight = select("#btRight"),
carWidth = 40,
left = -1,
auto = 0,
right = 1;

var controllerType = auto,
leftClick = false,
rightClick = false,
buttonClick = false,
goGoGoInitial = true,
timeLines = [],
startOverride = false;

init(true);
function init( initial = false ) {

    buttonClick = false;
    controllerType = auto;

    btRed.classList.remove("active");
    btYellow.classList.remove("active");
    btWhite.classList.remove("active");

    if( initial == true )
        gsap.set("#button", { opacity: 0, scale: 0.9 });
    else
        gsap.set("#button", { opacity: 0, scale: 1.5 });

    gsap.timeline({ repeat: 0, defaults: { duration: 1 } })
    .set("#button ul li", { backgroundColor: "#F004", borderColor: "#FFF6", })
    .set("#car1", { x: -40, y: 200 })
    .set("#car2", { x: 40, y: 200 })
    .set("#roadWrapper", { x: 0,  rotation: 0, transformOrigin: '50% 50%' })
    .set(["#useTrack","#road"], { y: "0px"} )
    .set("#tileWrapper", { rotation: 0, transformOrigin: '50% 50%' })
    .set(["#btLeft","#btRight","#btRed","#btYellow","#btWhite","#btExit","#searchlights"], { opacity: 0, autoAlpha: 0 })
    .set(["#btLeft","#btRight"], { opacity: 0, autoAlpha: 0 })
    .set("#btRight .cBtS", { rotate: 90, transformOrigin: '50% 50%' })
    .set("#button", { autoAlpha: 1 })
    .to(["#startButtonBg","#introCars","#button"], { opacity: 1 })
    .to("#button", {  scale: 0.9, ease: "back.out(3)" }, "<");

}




/* ***** Control panel menu event listeners ***** */
/* start button */

buttonW.addEventListener("mouseover", btOver);
function btOver(e) {
    gsap.to("#button", 0.25, {
        scale: 1,
        ease: "back.inOut(10)"
    });
    gsap.to("#button li", 0.25, {
        backgroundColor: "#FF84",
        borderColor: "#FFF5",
        stagger: 0.02
    });
}
buttonW.addEventListener("mouseout", btOut);
function btOut(e) {

    if( !buttonClick )
    {
        gsap.to("#button", 0.25, {
            scale: 0.9,
        });
        gsap.to("#button li", 0.25, {
            backgroundColor: "#F004",
            borderColor: "#FFF6",
            stagger: 0.02
        });
    }

}

button.addEventListener("click", goGoGo );
function goGoGo() {

    buttonClick = true;

    while (timeLines.length) { timeLines.pop(); } /* clear timelines array */

    gsap.timeline({ repeat: 0, defaults: { duration: 1 } })
    .to("#button ul li", { duration: 0.5, backgroundColor: "#af06", borderColor: "#FFF5", stagger: 0.02, } )
    .to(["#startButtonBg","#introCars"], { opacity: 0 }, 0.5)
    .to(["#btRed","#btYellow","#btWhite","#btExit"], { opacity: 1, autoAlpha: 1 }, "<")
    .call(roadAnim)
    .to("#button", { scale: 0.75, duration: 0.15, ease: "back.in(3)" }, 1)
    .to("#car1", { duration: 2, y: 0 }, "<")
    .to("#car2", { duration: 2, y: 0 }, "<")
    .to("#button", { scale: 2, opacity: 0, ease: "back.out(3)" }, 1.15)
    .set("#button", { autoAlpha: 0 }, 2)
    .call(stageAnim)
    .call(car1Anim)
    .call(car2Anim)
    .call(car1YAnim)
    .call(car2YAnim);

}

/* red car activation/toggle button */
btRed.addEventListener("click", btRedClick);
function btRedClick() {
    if( controllerType == left )
    {
        btRed.classList.remove("active");
        gsap.to(["#btLeft","#btRight"], { opacity: 0, autoAlpha: 0 }, 0);
        controllerType = auto;
    }
    else
    {
        btRed.classList.add("active");
        btYellow.classList.remove("active");
        gsap.to(["#btLeft","#btRight"], { opacity: 1, autoAlpha: 1 }, 0);
        controllerType = left;
    }
}

/* yellow car activation/toggle button */
btYellow.addEventListener("click", btYellowClick);
function btYellowClick() {
    if( controllerType == right )
    {
        btYellow.classList.remove("active");
        gsap.to(["#btLeft","#btRight"], { opacity: 0, autoAlpha: 0 }, 0);
        controllerType = auto;
    }
    else
    {
        btYellow.classList.add("active");
        btRed.classList.remove("active");
        gsap.to(["#btLeft","#btRight"], { opacity: 1, autoAlpha: 1 }, 0);
        controllerType = right;
    }
}

/* yellow car activation/toggle button */
btWhite.addEventListener("click", btWhiteClick);
function btWhiteClick() {
    if( btWhite.classList.contains("active") )
    {
        btWhite.classList.remove("active");
        gsap.to("#searchlights", { opacity: 0, autoAlpha: 0 }, 0);
    }
    else
    {
        btWhite.classList.add("active");
        gsap.to("#searchlights", { opacity: 1, autoAlpha: 1 }, 0);
    }
}

/* end race */
btExit.addEventListener("click", btExitClick);
function btExitClick() {

    buttonClick = false;

    timeLines.forEach((timeLine) => {
        timeLine.pause();
        timeLine.kill();
    });

    init();

}

/* left/right movement */
btLeft.addEventListener("mousedown", btLeftMousedown);
btLeft.addEventListener("touchstart", btLeftMousedown);
btLeft.addEventListener("mouseup", btLeftMouseup);
btLeft.addEventListener("touchend", btLeftMouseup);
function btLeftMousedown(e) { startOverride = true; leftClick = true; }
function btLeftMouseup(e) { leftClick = false; }

btRight.addEventListener("mousedown", btRightMousedown);
btRight.addEventListener("touchstart", btRightMousedown);
btRight.addEventListener("mouseup", btRightMouseup);
btRight.addEventListener("touchend", btRightMouseup);
function btRightMousedown(e) { startOverride = true; rightClick = true; }
function btRightMouseup(e) { rightClick = false; }




/* ****** GSAP timelines ***** */
/* rolling road */
function roadAnim(){
    
    let roadGsapAnim = gsap.timeline( { repeat: -1, defaults: { duration: 0.25, ease: "none" } })
    .to(["#useTrack","#road"], { y: "170px"} );
    timeLines.push(roadGsapAnim);

}

/* random movement of road representing helicopter flight */
function stageAnim(){

    let dur1 = gsap.utils.random(1.5, 3, 0.5);
    let stageGsapAnim = gsap.timeline({ onComplete: stageAnim, defaults: { ease: "back.inOut(1.7)", repeat: 0, yoyo: true, transformOrigin: '50% 50%' } })
    .to("#roadWrapper", { duration: dur1, x: "random(-30, 30)",  rotation: "random(-3, 3)", onUpdate: ()=> {
        if( buttonClick == true )
        {
            let tileRotation = 0 - ( gsap.getProperty("#roadWrapper", "rotation") * 2 );
            gsap.set("#tileWrapper", { rotation: tileRotation, transformOrigin: '50% 50%' });
        }
    }});
    timeLines.push(stageGsapAnim);
         
}

/* random Y movement of cars */
function car1YAnim(){
    let dur = gsap.utils.random(1.5, 3, 0.5),
    moveY = gsap.utils.random(-20, 20, 1);
    let car1GsapAnim = gsap.timeline({ onComplete: car1YAnim, defaults: { ease: "back.inOut(1.7)", repeat: 0, yoyo: true } })
    .to(["#car1","#car1Sl"], { duration: dur, y:moveY });
    timeLines.push(car1GsapAnim);
}
function car2YAnim(){
    let dur = gsap.utils.random(1.5, 3, 0.5),
    moveY = gsap.utils.random(-20, 20, 1);
    let car2GsapAnim =gsap.timeline({ onComplete: car2YAnim, defaults: { ease: "back.inOut(1.7)", repeat: 0, yoyo: true } })
    .to(["#car2","#car2Sl"], { duration: dur, y:moveY });
    timeLines.push(car2GsapAnim);
}

/* horizontal movement of car1 */
function car1Anim(){

    if( buttonClick == true )
    {

        var dur = 0.025,
        easing = "none",
        car1X = gsap.getProperty("#car1", "x"),
        car2X = gsap.getProperty("#car2", "x"),
        moveX = 0;

        if( ( controllerType == auto ) || ( controllerType == right ) )
        {
            dur = gsap.utils.random(1, 2, 1);
            easing = "back.inOut(1.7)";
            moveX = gsap.utils.random(-30, 30, 1);
        }
        else
        {
            if( leftClick == true )
                moveX = -2;
            else if( rightClick == true )
                moveX = 2;
            else
                dur = gsap.utils.random(1, 2, 1);
        }

        var newX1 = car1X + moveX;
        if( ( newX1 + carWidth ) >= car2X )
            newX1 = car2X - carWidth;
        newX1 = gsap.utils.clamp(-60, 60, newX1);

        let car1Tl = gsap.timeline( { repeatDelay: 0, onComplete: car1Anim })
        .to(["#car1","#car1Sl"], {
            duration: dur,
            x: getX1(),
            ease: easing,
            repeat: 0,
            onUpdate: () => car1AnimOnUpdate( startOverride, car1Tl, carWidth ),
        });

        function getX1() { return newX1; }

    }

}
function car1AnimOnUpdate( override, car1Tl, carWidth ) {

    if( override )
    {
        startOverride = false;
        car1Tl.kill();
        car1Anim();
    }
    else
    {
        /* collision detection to prevent overlapping cars */
        let thisX = gsap.getProperty("#car1", "x") + carWidth - 5;
        let car2X = gsap.getProperty("#car2", "x");
        if( thisX > car2X )
        {
            car1Tl.kill();
            let newX1 = car2X - carWidth;
            newX1 = gsap.utils.clamp(-60, 60, newX1);
            gsap.timeline( { duration: 0.25, repeatDelay: 0, onComplete: car1Anim })
            .to(["#car1","#car1Sl"], { x: newX1 });
        }
    }

}


/* horizontal movement of car2 */
function car2Anim() {

    if( buttonClick == true )
    {

        var dur = 0.025,
        easing = "none",
        car1X = gsap.getProperty("#car1", "x"),
        car2X = gsap.getProperty("#car2", "x"),
        moveX = 0;

        if( ( controllerType == auto ) || ( controllerType == left ) )
        {
            dur = gsap.utils.random(1, 2, 1);
            easing = "back.inOut(1.7)";
            moveX = gsap.utils.random(-30, 30, 1);
        }
        else
        {
            if( leftClick == true )
                moveX = -2;
            else if( rightClick == true )
                moveX = 2;
            else
                dur = gsap.utils.random(1, 2, 1);
        }

        var newX2 = car2X + moveX;
        if( newX2 < ( car1X + carWidth ) )
            newX2 = car1X + carWidth;
        newX2 = gsap.utils.clamp(-60, 60, newX2);
    
        let car2Tl = gsap.timeline( { repeatDelay: 0, onComplete: car2Anim })
        .to(["#car2","#car2Sl"], {
            duration: dur,
            x: getX2(),
            ease: easing,
            repeat: 0,
            onUpdate: () => car2AnimOnUpdate( startOverride, car2Tl, carWidth ),
        });

        function getX2() { return newX2; }

    }

}
function car2AnimOnUpdate( override, car2Tl, carWidth ) {

    if( override )
    {
        startOverride = false;
        car2Tl.kill();
        car2Anim();
    }
    else
    {
        /* collision detection to prevent overlapping cars */
        let thisX = gsap.getProperty("#car2", "x");
        let car1X = gsap.getProperty("#car1", "x") + carWidth - 5;
        if( thisX <= car1X ) 
        {
            car2Tl.kill();
            let newX2 = car1X + carWidth;
            newX2 = gsap.utils.clamp(-60, 60, newX2);
            gsap.timeline( { duration: 1, repeatDelay: 0, onComplete: car2Anim })
            .to(["#car2","#car2Sl"], { x: newX2 });
        }
    }

}

gsap.set( gsapWrapper, { autoAlpha: 1 });