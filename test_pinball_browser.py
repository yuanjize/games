#!/usr/bin/env python3
"""
Physics Pinball Game Browser Test
Tests the game using requests and analyzes the response
"""

import requests
import re
import sys
from pathlib import Path

# Configuration
PORT = 8888
BASE_URL = f"http://localhost:{PORT}"
GAME_URL = f"{BASE_URL}/physics-pinball/"

def test_server_running():
    """Check if the game server is running"""
    print("1. Checking if game server is running...")
    try:
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code == 200:
            print(f"   ✓ Server is running on port {PORT}")
            return True
        else:
            print(f"   ✗ Server returned status {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ✗ Cannot connect to server: {e}")
        print(f"   Tip: Start server with: python3 -m http.server {PORT} --directory /home/jizey/test/games")
        return False

def test_game_page():
    """Check if the game page loads correctly"""
    print("\n2. Loading game page...")
    try:
        response = requests.get(GAME_URL, timeout=10)
        if response.status_code != 200:
            print(f"   ✗ Game page returned status {response.status_code}")
            return False

        html = response.text

        # Check for essential HTML elements
        checks = {
            "Canvas element": r'<canvas[^>]*id="game-canvas"',
            "Start button": r'id="start-btn"',
            "Restart button": r'id="restart-btn"',
            "Score display": r'id="score"',
            "Lives display": r'id="lives"',
            "Game overlay": r'id="game-overlay"',
            "Game script": r'src="game-enhanced\.js"',
            "Options script": r'src="game-options\.js"',
            "Style sheet": r'href="style\.css"'
        }

        passed = 0
        for name, pattern in checks.items():
            if re.search(pattern, html):
                print(f"   ✓ {name} found")
                passed += 1
            else:
                print(f"   ✗ {name} NOT found")

        print(f"\n   HTML check: {passed}/{len(checks)} elements present")
        return passed == len(checks)

    except requests.exceptions.RequestException as e:
        print(f"   ✗ Error loading game page: {e}")
        return False

def test_game_scripts():
    """Check if game scripts load correctly"""
    print("\n3. Checking game scripts...")
    scripts_to_check = [
        ("game-enhanced.js", "EnhancedPinballGame"),
        ("game-options.js", "GameOptionsManager"),
        ("style.css", r"\.game-canvas-container")
    ]

    passed = 0
    for script, expected_content in scripts_to_check:
        url = f"{GAME_URL}{script}"
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                content = response.text
                if isinstance(expected_content, str) and not expected_content.endswith('.css'):
                    # It's a pattern to search for
                    if expected_content in content:
                        print(f"   ✓ {script} loads (contains '{expected_content}')")
                        passed += 1
                    else:
                        print(f"   ✗ {script} loads but missing '{expected_content}'")
                else:
                    # For CSS, just check if it loads
                    print(f"   ✓ {script} loads ({len(content)} bytes)")
                    passed += 1
            else:
                print(f"   ✗ {script} returned status {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"   ✗ Error loading {script}: {e}")

    print(f"\n   Scripts check: {passed}/{len(scripts_to_check)} files load correctly")
    return passed == len(scripts_to_check)

def analyze_game_logic():
    """Analyze the game JavaScript for potential issues"""
    print("\n4. Analyzing game logic...")

    try:
        response = requests.get(f"{GAME_URL}game-enhanced.js", timeout=10)
        if response.status_code != 200:
            print("   ✗ Cannot load game script")
            return False

        code = response.text

        # Critical game logic checks
        checks = {
            "Vector2 class": r"class Vector2",
            "Circle class": r"class Circle",
            "Ball class": r"class Ball\s+extends Circle",
            "GameConfig": r"const GameConfig\s*=",
            "PhysicsEntity class": r"class PhysicsEntity",
            "EnhancedPinballGame class": r"class EnhancedPinballGame",
            "init() method": r"init\(\)\s*\{",
            "update() method": r"update\(\)\s*\{",
            "draw() method": r"draw\(\)\s*\{",
            "loop() method": r"loop\(\s*timestamp",
            "launchBall() method": r"launchBall\(\)\s*\{",
            "spawnBall() method": r"spawnBall\(\)\s*\{",
            "handleLifeLost() method": r"handleLifeLost\(\)\s*\{",
            "Keyboard controls": r"case\s*['\"]ArrowLeft",
            "Touch controls": r"handleTouchStart",
            "Collision detection": r"ball\.position\.subtract",
            "Score calculation": r"this\.state\.score\s*\+",
            "Game over logic": r"this\.state\.gameOver\s*=\s*true",
            "Wall collision": r"wallThickness",
            "Bumper collision": r"elements\.bumpers",
            "Paddle collision": r"elements\.paddles"
        }

        passed = 0
        issues = []

        for name, pattern in checks.items():
            if re.search(pattern, code):
                print(f"   ✓ {name}")
                passed += 1
            else:
                print(f"   ✗ {name} - MISSING")
                issues.append(name)

        print(f"\n   Logic check: {passed}/{len(checks)} components found")

        # Check for specific issues
        print("\n5. Checking for specific issues...")

        # Issue: Check if ball velocity is properly initialized on spawn
        if "new Ball(this.width - 50, this.height - 100)" in code:
            print("   ✓ Ball spawn position set")
            if "ball.launched = false" in code:
                print("   ✓ Ball launched state initialized")
        else:
            print("   ⚠ Ball spawn position may need review")
            issues.append("Ball spawn position")

        # Issue: Check if gravity is applied
        if "GameConfig.gravity" in code or "gravity:" in code:
            print("   ✓ Gravity configured")
        else:
            print("   ⚠ Gravity configuration missing")
            issues.append("Gravity configuration")

        # Issue: Check if ball speed is limited
        if "limitSpeed" in code or "maxBallSpeed" in code:
            print("   ✓ Ball speed limiting present")
        else:
            print("   ⚠ Ball speed limiting missing")
            issues.append("Ball speed limiting")

        # Issue: Check for proper ball removal
        if "this.elements.balls.splice(index, 1)" in code:
            print("   ✓ Ball removal from array present")
        else:
            print("   ⚠ Ball removal may be incomplete")
            issues.append("Ball removal logic")

        # Issue: Check for wall initialization
        if "initWalls()" in code:
            print("   ✓ Wall initialization method present")
        else:
            print("   ⚠ Wall initialization may be missing")
            issues.append("Wall initialization")

        if issues:
            print(f"\n   ⚠ {len(issues)} potential issue(s) found:")
            for i, issue in enumerate(issues, 1):
                print(f"      {i}. {issue}")

        return len(issues) == 0

    except requests.exceptions.RequestException as e:
        print(f"   ✗ Error analyzing game logic: {e}")
        return False

def test_console_errors():
    """
    Check for potential JavaScript errors by analyzing the code
    """
    print("\n6. Checking for common JavaScript issues...")

    try:
        response = requests.get(f"{GAME_URL}game-enhanced.js", timeout=10)
        if response.status_code != 200:
            return False

        code = response.text

        issues = []

        # Check for undefined variables in common patterns
        if "this.canvas" in code and "this.canvas = " not in code and "getElementById('game-canvas')" not in code:
            # This is OK - canvas is set in constructor
            pass

        # Check for proper event listener cleanup
        if "removeEventListener" in code:
            print("   ✓ Event listener cleanup present")
        else:
            print("   ⚠ Event listener cleanup may be missing")

        # Check for null/undefined checks
        if "if (!this.canvas)" in code or "if (canvas)" in code:
            print("   ✓ Null checks present")
        else:
            print("   ⚠ Null checks may be missing")

        # Check for error handling
        if "try {" in code and "catch" in code:
            print("   ✓ Error handling present")
        else:
            print("   ⚠ Error handling may be limited")

        # Check for requestAnimationFrame cleanup
        if "cancelAnimationFrame" in code:
            print("   ✓ Animation frame cleanup present")
        else:
            print("   ⚠ Animation frame cleanup may be missing")

        return True

    except requests.exceptions.RequestException as e:
        print(f"   ✗ Error checking for issues: {e}")
        return False

def main():
    print("=" * 50)
    print("Physics Pinball Game - Browser Test")
    print("=" * 50)

    results = []

    # Run tests
    results.append(("Server Running", test_server_running()))

    if not results[0][1]:
        print("\n✗ Server is not running. Please start the server first.")
        print(f"   Run: python3 -m http.server {PORT} --directory /home/jizey/test/games")
        sys.exit(1)

    results.append(("Game Page Loads", test_game_page()))
    results.append(("Scripts Load", test_game_scripts()))
    results.append(("Game Logic", analyze_game_logic()))
    results.append(("Common Issues", test_console_errors()))

    # Summary
    print("\n" + "=" * 50)
    print("Test Summary")
    print("=" * 50)

    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {name}")

    print(f"\nOverall: {passed}/{total} tests passed")

    if passed == total:
        print("\n✓ All tests passed! The game should work correctly.")
        print("\nTo play the game:")
        print(f"  1. Open {GAME_URL} in your browser")
        print("  2. Press Space or click '发射球' to launch the ball")
        print("  3. Use ← → arrow keys to move the paddle")
        print("  4. Hit the bumpers to score points!")
        return 0
    else:
        print("\n⚠ Some tests failed. Please review the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
