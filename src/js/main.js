const dialog = document.querySelector("#dialog");
const form = document.getElementById("myform");
const floorContainer = document.getElementById('floors-container');
const liftContainer = document.getElementById('lift-container');
const goBackBtn = document.getElementById('go-back');

// Storing lift states (idle, moving, busy )
const liftStates = [];
const requestQueue = [];

const goBack = () => {
    window.location.reload();
    goBackBtn.style.display = 'none';
}

goBackBtn.addEventListener('click', goBack);

window.onload = () => {
    dialog.showModal();
};

const submitform = new Promise((resolve) => {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(form);
        let floors = data.get('floors');
        let lifts = data.get('lifts');

        createFloors(floors);
        createLifts(lifts);

        if (dialog.open) dialog.close();
        goBackBtn.style.display = 'flex';

        window.scroll({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });

        resolve();
    });
});

const createFloors = (floors) => {
    for (let i = floors; i >= 1; i--) {
        const floor = document.createElement('div');
        const floorNButtonCont = document.createElement('div');

        //floor
        floor.classList.add('floor');
        floor.id = `floor-${i}`;
        floorContainer.append(floor);

        //floorNumber P
        const floorNumber = document.createElement('p');
        floorNumber.classList.add('floor-number');
        floorNumber.textContent = `Floor ${i}`;
        floorNButtonCont.appendChild(floorNumber);

        //button-container
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        floorNButtonCont.append(buttonContainer);

        floor.append(floorNButtonCont);

        //buttons
        const buttonsArr = ['up', 'down'];
        Array.from({ length: buttonsArr.length }, (_, index) => {
            //for adding buttons
            const button = document.createElement('button');
            button.classList.add('up-down-btn');
            button.classList.add(`button-of-floor-${i}`);
            button.id = buttonsArr[index];
            button.textContent = buttonsArr[index];

            //for the images inside it.
            const image = document.createElement('img');
            image.classList.add("image");
            image.src = 'https://img.icons8.com/material-sharp/24/000000/long-arrow-up.png';
            button.append(image);
            if (index == 1) image.style.rotate = '180deg';

            buttonContainer.append(button);
            if (i === floors && button.id == 'up') button.style.visibility = 'hidden';
            if (i === 1 && button.id == 'down') button.style.visibility = 'hidden';

            //button functionality
            button.addEventListener('click', () => {
                handleLiftRequest(i);
            });
        });

        //floorLine
        const floorLine = document.createElement('div');
        floorLine.classList.add('floor-line');
    }
}

const createLifts = (lifts) => {
    for (let i = 1; i <= lifts; i++) {
        const [lift, liftNo, liftDoorContainer, leftDoor, rightDoor] = [document.createElement('div'), document.createElement('p'), document.createElement('div'), document.createElement('div'), document.createElement('div')];

        //liftContainer
        liftContainer.classList.add('lifts-container');

        //lift
        lift.classList.add("lift");
        lift.id = `lift-${i}`;
        lift.style.transform = `translateY(0px)`;

        //liftNo
        liftNo.classList.add('liftno');
        liftNo.textContent = i;

        //lift door container
        liftDoorContainer.classList.add('lift-doors');

        //left door
        leftDoor.classList.add('left-door', 'doors');

        //right door
        rightDoor.classList.add('right-door', 'doors');

        //appending the elements to their respective parents
        lift.append(liftNo);
        lift.append(liftDoorContainer);
        liftDoorContainer.appendChild(leftDoor);
        liftDoorContainer.appendChild(rightDoor);
        liftContainer.append(lift);

        const defaultFloorLocation = floorContainer.querySelector('#floor-1');
        defaultFloorLocation.append(liftContainer);

        liftStates.push({ moving: false, busy: false, currentFloor: 1 });
    }
};

const handleLiftRequest = (floorNum) => {
    const lifts = Array.from(liftContainer.children);
    const liftsPositionArr = [];

    // Get the current floor position of each lift
    for (let i = 0; i < lifts.length; i++) {
        const translateYValue = lifts[i].style.transform;
        const regex = /[\d]+/;
        const match = translateYValue.match(regex);
        liftsPositionArr.push((match ? (parseInt(match[0], 10) / 80) + 1 : 1));
    }


    // Finding the closest available (idle and not busy) lift
    const findingTheClosestLift = (liftsPositionArr, floorUserClicked) => {
        const minimumDistance = [];
        let closestLift;
        for (let i = 0; i < liftsPositionArr.length; i++) {
            // Only considering lifts that are not moving and not busy
            if (!liftStates[i].moving && !liftStates[i].busy) {
                console.log(liftStates[i].currentFloor, floorUserClicked)
                minimumDistance.push(Math.abs(liftsPositionArr[i] - floorUserClicked));
            } else {
                minimumDistance.push(Infinity); // Ignore moving or busy lifts
            }
        }
        closestLift = minimumDistance.indexOf(Math.min(...minimumDistance));
        console.log("closest lift is :",closestLift)
        return closestLift;
    }

    
    
    // console.log(liftsPositionArr)
    // console.log(floorNum)
    const liftAlreadyAtFloor = (liftIndex, floorNum) => {
        if (liftStates[liftIndex].currentFloor === floorNum) {
            triggerDoorAnimation(lifts[liftIndex], liftIndex);
            return true;
        }
        return false;
    }
    
    // Getting the closest available lift
    const closestLift = findingTheClosestLift(liftsPositionArr, floorNum);
    console.log(closestLift)
    if (closestLift === -1) return;
    
    if (liftsPositionArr.includes(Number(floorNum))) {
        console.log("Lift already at requested floor");
        liftAlreadyAtFloor(closestLift, floorNum);
        return;
    }
    

    const availableLiftExists = liftStates.some(lift => !lift.moving && !lift.busy);

    if (!availableLiftExists) {
        console.log("No lifts are available, all lifts are busy or moving");
        console.log(liftsPositionArr)
        if (!requestQueue.includes(Number(floorNum))){
            console.log("Adding floor to the queue")
            requestQueue.push(Number(floorNum));
            console.log(requestQueue)
            return;
        } else if (liftsPositionArr.includes(Number(floorNum))) {
            console.log("Lift already at requested floor");
            liftAlreadyAtFloor(closestLift, floorNum);
        }
        return;
    }
    
    if (!liftAlreadyAtFloor(closestLift, floorNum)) {
        moveLiftToFloor(closestLift, floorNum, lifts[closestLift]);
        if (liftsPositionArr.includes(Number(floorNum))) {
            console.log("Lift already at requested floor");
            liftAlreadyAtFloor(closestLift, floorNum);
            return;
        }
    }
};

const moveLiftToFloor = (liftIndex, floorNum, selectedLift) => {
    const liftsPositionArr = liftStates.map((lift) => lift.currentFloor);
    selectedLift.style.transform = `translateY(-${80 * (floorNum - 1)}px)`;
    selectedLift.style.transition = `${Math.abs(floorNum - liftsPositionArr[liftIndex]) * 2}s linear`;

    liftStates[liftIndex].moving = true;

    selectedLift.addEventListener('transitionend', function (event) {
        if (event.propertyName === 'transform') {
            triggerDoorAnimation(selectedLift, liftIndex);
            liftStates[liftIndex].moving = false;
            liftStates[liftIndex].currentFloor = floorNum;
        }
    }, { once: true });
};

const triggerDoorAnimation = (lift, liftIndex) => {
    // Marking as busy while doors are opening
    liftStates[liftIndex].busy = true;
    
    lift.children[1].children[0].style.animation = `left-door-open 5s both`;
    lift.children[1].children[1].style.animation = `right-door-open 5s both`;

    // Resetting animations
    setTimeout(() => {
        lift.children[1].children[0].style.animation = ``;
        lift.children[1].children[1].style.animation = ``;
        liftStates[liftIndex].busy = false;

        // if there are any pending requests in the queue
        if (requestQueue.length > 0) {
            const nextFloor = requestQueue.shift();
            console.log(`Handling queued request for floor ${nextFloor}`);
            moveLiftToFloor(liftIndex, nextFloor, lift);
        }
    }, 5000);
};
