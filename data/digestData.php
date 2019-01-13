<?php

/*

This is a script to provide the input data for the visualization.
It opens the source CSV and converts it to a more easily readable format for display.

Author: Kai Garrott <garrottkai@gmail.com>

*/

$fileName = 'MOD_NDVI_16_2018-02-18_rgb_360x180.CSV';

/*
Parse the specifically formatted CSV data files used here.
These files represent a 1 x 1 degree grid of the Earth's surface.
Each line of the original CSV corresponds to an integer latitude value
and consists of 360 decimal measurements, one for each integer longitude value.
The return value of this function is a CSV string containing the nonzero measurements,
one per line, in the format: latitude,longitude,measurement
*/
function parseFile(string $fileName): string {

    $file = file_get_contents($fileName);

    // separate on whatever newline characters may be present
    $lines = preg_split('/\r\n|\r|\n/', $file);

    // output to serialize
    $processed = [];

    // move from north to south through the array
    $lat = -90;

    foreach($lines as $line) {
        // move from west to east on the line
        $long = -180;
        $procLine = [];
        $values = explode(',', $line);
        foreach($values as $value) {
            // 99999.0 is the zero value; we drop these but increment the long counter
            if($value && $value != 99999.0) {
                $coords = $lat . "," . $long . "," . $value . "\n";
                // add the new coordinate line to the output
                array_push($procLine, $coords);
            }
            $long += 1;
        }
        // dump the values for the line in with the rest - no need to preserve original format
        $processed = array_merge($processed, $procLine);
        $lat += 1;
    }
    return(implode($processed));
}

// create the output CSV file
function writeFile(string $data): void {
    $file = fopen('data.csv', 'w');
    fwrite($file, $data);
    fclose($file);
}

try {
    // things actually happen here
    $output = parseFile($fileName);
    writeFile($output);
} catch(Exception $exception) {
    // yell into the void
    echo $exception->getMessage;
}
