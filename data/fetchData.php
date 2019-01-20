<?php

/*

This script checks the NASA TERRA/AQUA MODIS server https://neo.sci.gsfc.nasa.gov/view.php?datasetId=MOD_NDVI_16 for updated data.
The 16-day, 1-degree vegetation index grid is retrieved as a CSV file.
If new data is found, it replaces the existing file.
This script is intended to be run by cron at regular intervals

*/
