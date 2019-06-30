1. place grid of images
1a. follow adjacency rules to make connected parts
2. create a 1D/2D grid, 1:1 with pixels.
2a. mark edges as done: 0
2b. mark interiors as to-be done: 1

have to calculate the min and max values present in each "path"; without knowing the max-distance between any two pixels in the same path, there is now way to know the color-value of a single pixel on the path (since it should be "between" min and max values).

3. create a 2D grid
4. read the source image, draw to a second results image