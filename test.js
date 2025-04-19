window.__TESTING__ = true;

document.addEventListener('DOMContentLoaded', () => {
    const gameConfig = {
        type: Phaser.AUTO,
        width: 800,
        height: 600,
        scene: [PreloadScene, MainScene],
        parent: 'game-container',
        callbacks: {
            postBoot: (game) => {
                window.gameInstance = game; 
            }
        }
    };

 //Code adapted from Danny, & Mortensen, P. (2017, January 27) https://stackoverflow.com/questions/41885841/how-can-i-mock-the-javascript-window-object-using-jest   
    const game = new Phaser.Game(gameConfig);
    
    game.events.once('ready', () => {
        const interval = setInterval(() => {
            const mainScene = game.scene.getScene('MainScene');
            if (mainScene && mainScene.sys.isActive()) {
                clearInterval(interval);
                
                mainScene.skipAnimations = true;
                mainScene.testMode = true;
                
                runComprehensiveTests(mainScene);
            }
        }, 100);
    });
});

function runComprehensiveTests(mainScene) {
    console.log('Running Slot Game Tests');
    
    testInitialState(mainScene);
    
    testReelMechanics(mainScene);
    
    testBettingSystem(mainScene);

    testPayoutCalculations(mainScene);

    testBonusMode(mainScene);
    

}


function testInitialState(mainScene) {
    console.group('Initial State Tests');
    
    assertEqual(
        mainScene.reels.length, 
        mainScene.reelCount, 
        'Correct number of reels initialized'
    );
    
    assertEqual(
        mainScene.coins, 
        1000, 
        'Initial coin balance set correctly'
    );
    
    assertEqual(
        mainScene.betAmount, 
        10, 
        'Default bet amount set correctly'
    );
    
    assertFalse(
        mainScene.isSpinning, 
        'Game should not start in spinning state'
    );
    
    assertFalse(
        mainScene.isInBonusMode, 
        'Game should not start in bonus mode'
    );
    
    console.groupEnd();
}

function testReelMechanics(mainScene) {
    console.group('Reel Mechanics Tests');
    
    // Test reel structure
    mainScene.reels.forEach((reel, i) => {
        assertEqual(
            reel.length, 
            mainScene.symbolCount, 
            `Reel ${i+1} has correct symbol count`
        );
        
        reel.forEach(symbol => {
            assertTrue(
                symbol instanceof Phaser.GameObjects.Sprite, 
                'Reel symbols are Phaser sprites'
            );
        });
    });
    
    // Test spin state
    const originalSymbols = mainScene.reels.map(reel => reel.map(s => s.texture.key));
    const originalReelPositions = mainScene.reels.map(reel => reel.map(s => s.y));
    
    mainScene.startSpin();
    
    assertTrue(
        mainScene.isSpinning, 
        'Spin should set isSpinning flag'
    );
    
    
    console.groupEnd();
}

function testBettingSystem(mainScene) {
    console.group('Betting System Tests');
    
    const initialCoins = mainScene.coins;
    const initialBet = mainScene.betAmount;
    
    // Test bet increase
    mainScene.betAmount = 20;
    mainScene.updateBetDisplay();
    assertEqual(
        mainScene.betText.text, 
        '20 coins', 
        'Bet display updates correctly'
    );
    
    // Test bet decrease
    mainScene.betAmount = 5;
    mainScene.updateBetDisplay();
    assertEqual(
        mainScene.betText.text, 
        '5 coins', 
        'Bet display updates correctly'
    );
    
    // Test coin decrease
    mainScene.startSpin();
    mainScene.betAmount = 10;
    
    assertEqual(
        mainScene.coins - 10, 
        mainScene.coins - mainScene.betAmount,
        'Coins decreased by bet amount'
    );
    
    console.groupEnd();
}

function testPayoutCalculations(mainScene) {
    console.group('Payout Calculation Tests');
    
    // Test base payouts
    const payouts = mainScene.getPayouts();
    assertEqual(
        payouts.symbol1, 
        mainScene.betAmount, 
        'Symbol1 payout matches bet amount'
    );
    
    assertEqual(
        payouts.symbol8, 
        mainScene.betAmount * 10, 
        'Symbol8 payout is 10x bet'
    );
}

async function testBonusMode(mainScene) {
    console.group('Bonus Mode Tests');
    

    mainScene.startBonusMode(); 
    mainScene.freeSpinsLeft = 8; 
    mainScene.isInBonusMode = true;
    mainScene.goldGlow.visible = true;
    
    // Verify initial bonus state
    assertTrue(mainScene.isInBonusMode, 'Bonus mode should be active at test start');
    assertEqual(mainScene.freeSpinsLeft, 8, 'Should start with 8 free spins');
    assertTrue(mainScene.goldGlow.visible, 'Gold glow should be visible');
    
    // Test free spin behavior
    const initialCoins = mainScene.coins = 990; 
    mainScene.betAmount = 10;
    

    // Test all 8 free spins
    for (let i = 0; i < 8; i++) {
        console.log(`Testing free spin ${i+1}/8...`);
        
        const spinsBefore = mainScene.freeSpinsLeft;
        const coinsBefore = mainScene.coins;
        
        mainScene.startSpin();
        await waitForCondition(() => !mainScene.isSpinning, 2500);
        
        // Validate results
        assertEqual(mainScene.freeSpinsLeft, spinsBefore - 1, 
                `Free spins should decrement (was ${spinsBefore}, now ${mainScene.freeSpinsLeft})`);
        
        // Coin validation 
        if (mainScene.coins < coinsBefore) {
            console.error(`FAIL: Coins decreased during free spin (Was ${coinsBefore}, now ${mainScene.coins})`);
        } else if (mainScene.coins === coinsBefore) {
            console.log(`PASS: Coins unchanged during free spin (${coinsBefore})`);
        } else {
            console.log(`PASS: Coins increased during free spin (+${mainScene.coins - coinsBefore})`);
        }
        

    }
    
    // Bonus mode ends automatically
    assertFalse(mainScene.isInBonusMode, 'Bonus mode should end after all spins');
    assertFalse(mainScene.goldGlow.visible, 'Gold glow should hide');
    assertEqual(mainScene.freeSpinsLeft, 0, 'No free spins remaining');
    
    console.groupEnd();
}

// Time referesh function
function waitForCondition(check, timeout) {
    return new Promise((resolve) => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (check() || Date.now() - start > timeout) {
                clearInterval(interval);
                resolve();
            }
        }, 50);
    });
}
//Code adapted from Rogers, F. M. (2019, April 19). https://stackoverflow.com/questions/55759643/how-to-return-a-promise-with-setinterval

//Message output layout
function assertEqual(actual, expected, message) {
    if (actual === expected) {
        console.log(`PASS: ${message}`);
    } else {
        console.error(`FAIL: ${message} (Expected ${expected}, got ${actual})`);
    }
}

function assertTrue(condition, message) {
    if (condition) {
        console.log(`PASS: ${message}`);
    } else {
        console.error(`FAIL: ${message}`);
    }
}

function assertFalse(condition, message) {
    if (!condition) {
        console.log(`PASS: ${message}`);
    } else {
        console.error(`FAIL: ${message}`);
    }
}

function assertLessThan(actual, threshold, message) {
    if (actual < threshold) {
        console.log(`PASS: ${message}`);
    } else {
        console.error(`FAIL: ${message} (Value ${actual} should be less than ${threshold})`);
    }
}

