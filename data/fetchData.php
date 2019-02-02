<?php

/*

This script checks the NASA TERRA/AQUA MODIS server https://neo.sci.gsfc.nasa.gov/view.php?datasetId=MOD_NDVI_16 for updated data.
The 16-day, 1-degree vegetation index grid is retrieved as a CSV file.
If new data is found, it replaces the existing file.
This script is intended to be run by cron at regular intervals

*/

// ftp://neoftp.sci.gsfc.nasa.gov/csv/MOD_NDVI_16/MOD_NDVI_16_2019-01-01.CSV.gz

// get first line with date that data was posted
$dateLine = fgets(fopen('data.csv', 'r'));

$dataDate = new DateTime($dateLine);
$now = date('Y-m-d');

$elapsed = $now->diff($dataDate);

// only look for new data if the old data is at least 16 days old
// this will almost never evaluate false, as data is not normally posted for several weeks after its collection date
if($elapsed->d >= 16) {

    try {

        while($dataDate <= $now) {

            $dataDate->add(new DateInterval('P1D'));
            $iso = $dataDate->format('Y-m-d');
            $uri = 'ftp://neoftp.sci.gsfc.nasa.gov/csv/MOD_NDVI_16/MOD_NDVI_16_' . $iso . '.CSV.gz';

            $curl = curl_init($uri);
            curl_setopt($curl, CURLOPT_TIMEOUT, 30);

            $res = curl_exec($curl);

            if(!$res) {

                continue;

            }

            $csv = $res

        }

    } catch (e) {

        echo(e.getMessage());
        return;

    }

}
