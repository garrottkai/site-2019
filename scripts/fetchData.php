<?php

/*

This script checks the NASA TERRA/AQUA MODIS server https://neo.sci.gsfc.nasa.gov/view.php?datasetId=MOD_NDVI_16 for updated data.
The 16-day, 1-degree vegetation index grid is retrieved as a CSV file.
If new data is found, it replaces the existing file.
This script is intended to be run by cron at regular intervals

*/

function fetchData() {

    // get first line with date that data was posted
    $dateLine = fgets(fopen('data.csv', 'r'));
    echo 'Date line: ' . $dateLine;
    $dataDate = new DateTime($dateLine);
    $now = new DateTime();
    echo 'Now: ' . $now->format('Y-m-d') . "\n";
    $elapsed = $now->diff($dataDate);
    echo 'Elapsed: ' . $elapsed->m . ' months ' . $elapsed->d . ' days' . "\n";

    // only look for new data if the old data is at least 16 days old
    // this will almost never evaluate false, as data is not normally posted for several weeks after its collection date
    if($elapsed->m > 0 || $elapsed->d >= 16) {

        try {

            while($dataDate < $now) {

                $dataDate->add(new DateInterval('P1D'));
                $iso = $dataDate->format('Y-m-d');
                $uri = 'https://neo.sci.gsfc.nasa.gov/archive/csv/MOD_NDVI_16/MOD_NDVI_16_' . $iso . '.CSV.gz';

                $curl = curl_init($uri);
                curl_setopt($curl, CURLOPT_TIMEOUT, 30);
                curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

                $res = curl_exec($curl);

                if(!$res) {

                    echo 'No data found for ' . $iso . "\n";
                    continue;

                }

                echo 'Data found for date: ' . $iso . "\n";

                $unarchived = zlib_decode($res);
                $raw = fopen('raw.csv', 'w');
                fwrite($raw, $unarchived);
                fclose($raw);

                echo 'CSV written' . "\n";

                return $iso;

            }

        } catch(Exception $e) {

            throw(new Exception($e->getCode(), $e->getMessage()));

        }

    }

}
