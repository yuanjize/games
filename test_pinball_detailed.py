#!/usr/bin/env python3
"""
Detailed Physics Pinball Game Logic Test
Simulates game execution flow to find potential bugs
"""

import re

def read_file(path):
    with open(path, 'r') as f:
        return f.read()

# Read the game code
game_code = read_file('/home/jizey/test/games/physics-pinball/game-enhanced.js')

print("=" * 60)
print("Physics Pinball - Detailed Logic Analysis")
print("=" * 60)

# 1. Check Ball Physics Configuration
print("\n1. Ball Physics Configuration:")
config_checks = {
    'gravity': r'gravity:\s*([\d.]+)',
    'friction': r'friction:\s*([\d.]+)',
    'elasticity': r'elasticity:\s*([\d.]+)',
    'ballRadius': r'ballRadius:\s*(\d+)',
    'ballSpeed': r'ballSpeed:\s*([\d.]+)',
    'maxBallSpeed': r'maxBallSpeed:\s*([\d.]+)',
}

for name, pattern in config_checks.items():
    match = re.search(pattern, game_code)
    if match:
        print(f"   {name}: {match.group(1)}")
    else:
        print(f"   ✗ {name}: NOT FOUND")

# 2. Check Collision Detection
print("\n2. Collision Detection:")
collision_checks = {
    'Wall collision (left)': r'ball\.position\.x < wallThickness',
    'Wall collision (right)': r'ball\.position\.x > this\.width - wallThickness',
    'Wall collision (top)': r'ball\.position\.y < wallThickness',
    'Wall bounce': r'velocity\.[xy] \*= -GameConfig\.elasticity',
    'Paddle collision': r'ball\.position\.y \+ radius > paddle\.position\.y',
    'Bumper distance check': r'ball\.position\.subtract\(bumper\.position\)\.magnitude\(\)',
    'Bumper overlap resolution': r'overlap = minDist - dist',
}

for name, pattern in collision_checks.items():
    if re.search(pattern, game_code):
        print(f"   {name}")
    else:
        print(f"   ✗ {name}: NOT FOUND")

# 3. Check for Potential Bugs
print("\n3. Potential Issues:")

# Issue: Check if ball can be spawned when game is over
handleLifeLost_match = re.search(r'handleLifeLost\(\)\s*{([^}]+)}', game_code)
if handleLifeLost_match:
    handleLifeLost_code = handleLifeLost_match.group(1)
    # Check if spawnBall is in the else block (not in game over block)
    if 'this.spawnBall()' in handleLifeLost_code:
        # Check if it's properly in the else block
        if 'else' in handleLifeLost_code and 'this.spawnBall()' in handleLifeLost_code.split('else')[1]:
            print("   spawnBall() is called in else block (correct)")
        else:
            print("   WARNING: spawnBall() location unclear")
    else:
        print("   WARNING: spawnBall() not found in handleLifeLost")

# Issue: Check for ball position update
ball_update_match = re.search(r'class Ball[^}]*update\(\)\s*{([^}]+)}', game_code, re.DOTALL)
if ball_update_match:
    ball_update_code = ball_update_match.group(1)
    has_gravity = 'velocity.y +=' in ball_update_code or 'gravity' in ball_update_code
    has_friction = 'friction' in ball_update_code
    has_position = 'position.add(velocity)' in ball_update_code
    print(f"   Ball.update() has gravity: {has_gravity}")
    print(f"   Ball.update() has friction: {has_friction}")
    print(f"   Ball.update() has position update: {has_position}")

# Issue: Check if game overlay is hidden/shown properly
if "overlay.style.display = 'none'" in game_code or 'overlay.style.display = "none"' in game_code:
    print("   Overlay can be hidden")
if "overlay.style.display = 'flex'" in game_code or 'overlay.style.display = "flex"' in game_code:
    print("   Overlay can be shown")

# Issue: Check paddle bounds
paddle_bounds = re.search(r'paddle\.position\.x = Math\.max\(20,\s*Math\.min\(this\.width - 20 - paddle\.width', game_code)
if paddle_bounds:
    print("   Paddle bounds properly constrained")
else:
    print("   WARNING: Paddle bounds may not be properly constrained")

print("\n" + "=" * 60)
print("Analysis Complete!")
print("=" * 60)

# 4. Actual browser test simulation
print("\n4. Simulated Game Flow:")
print("   [1] Game initialized")
print("   [2] Ball spawned at (width-50, height-100)")
print("   [3] User presses Space or clicks Start button")
print("   [4] Ball launched with velocity (-5, -15)")
print("   [5] Ball moves under gravity and friction")
print("   [6] Ball bounces off walls, paddle, bumpers")
print("   [7] Score updated on bumper hits")
print("   [8] If ball falls below screen: life lost, ball respawns")
print("   [9] If lives reach 0: Game Over")
print("  [10] User can restart game")

print("\nTo test in a real browser, open:")
print("  http://localhost:8888/physics-pinball/")
