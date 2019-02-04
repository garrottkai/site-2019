<?php

/*

This is a script to provide the input data for the visualization.
It opens the source CSV and converts it to a more easily readable format for display.

Author: Kai Garrott <garrottkai@gmail.com>

*/

require_once('fetchData.php');

/*
Parse the specifically formatted CSV data files used here.
These files represent a 0.1 x 0.1 degree grid of the Earth's surface.
Each of the 1800 lines of the original CSV corresponds to an 0.1 degree latitude value
and consists of 3600 decimal measurements, one for each 0.1 degree longitude value.
The return value of this function is a CSV string containing only the nonzero measurements falling on integer degree values, one per line, in the format: latitude,longitude,measurement
*/
function parseFile(string $fileName, string $date): string {

    $file = file_get_contents($fileName);

    // separate on whatever newline characters may be present
    $lines = preg_split('/\r\n|\r|\n/', $file);

    // output to serialize; begins with IS0 date of the data
    $processed = [$date . "\n"];

    // move from north to south through the array
    $lat = -90;

    $numLines = count($lines);

    for($i = 0; $i < $numLines; $i += 10) {

        // move from west to east on the line
        $line = $lines[$i];
        $long = -180;
        $procLine = [];
        $values = explode(',', $line);

        $numPoints = count($values);

        for($j = 0; $j < $numPoints; $j += 10) {

            $value = $values[$j];
            // 99999.0 is the zero value; we drop these but increment the long counter
            if($value && $value != 99999.0) {

                $coords = $lat . "," . $long . "," . $value . "\n";
                // add the new coordinate line to the output
                array_push($procLine, $coords);

            }

            ++$long;

        }

        // dump the values for the line in with the rest - no need to preserve original format
        $processed = array_merge($processed, $procLine);
        ++$lat;

    }

    return(implode($processed));

}

// create the output CSV file
function writeFile(string $data): void {

    $file = fopen('../public_html/data/data.csv', 'w');
    fwrite($file, $data);
    fclose($file);

}

try {

    // things actually happen here
    $dataDate = fetchData();

    if($dataDate) {

        $output = parseFile('../public_html/data/raw.csv', $dataDate);
        writeFile($output);

    } else {

        echo "No new data found.\n";

    }

} catch(Exception $exception) {
    // yell into the void
    echo $exception->getMessage;

}
