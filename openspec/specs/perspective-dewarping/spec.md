# Spec: perspective-dewarping

## Purpose
Client-side perspective dewarping on HTML Canvas using homography matrix math and bilinear interpolation without external libraries.

## Requirements

### Dimension Calculation
The system MUST calculate output canvas dimensions using maximum parallel edge lengths:
- Width: max(dist(TL, TR), dist(BL, BR))
- Height: max(dist(TL, BL), dist(TR, BR))

#### Scenario: Dimension calculation
Given four selected corners: TL(10, 10), TR(190, 20), BR(200, 110), BL(20, 100)
When output dimensions are calculated
Then width MUST be max(180.28, 180.28) = 181px
And height MUST be max(90.55, 90.55) = 91px

### Homography Matrix Solver
The system MUST solve a 3x3 homography projection mapping destination coordinates to source pixels using Gaussian elimination.

#### Scenario: Solve homography
Given calculated destination dimensions and 4 source points
When Gaussian elimination solves the projection system
Then the system MUST return a valid 3x3 homography matrix.

### Bilinear Interpolation
The system MUST reconstruct the corrected image via bilinear interpolation for each destination coordinate.

#### Scenario: Interpolated reconstruction
Given a computed homography matrix and destination coordinate
When destination pixel is mapped back to fractional source coordinates
Then the system MUST interpolate color using the nearest 4 source pixels.

### Drag Constraints and Convexity
The system MUST restrict corner handle dragging within image boundaries and block configurations forming non-convex or self-intersecting shapes.

#### Scenario: Prevent non-convex shape
Given 4 corner handles forming a convex quad
When a handle is dragged past the diagonal line connecting adjacent corners
Then the system MUST block the drag and revert to the last convex position.
