var currentDirection = 0;
var previousProductVolume = 0;

// Existing tanks configuration
var reportData = [];
var chartData = [];
var maxChartDataItem = 0;

// Tanks reporting DataTable
var tankReportingDatatable;
var tanksConfigurationData;

// Localization
$("#rpGenerateReportTanksButton").val(localizeString("GENERATE_REPORT"));

$(".trpDateTimeLabel").text(localizeString("DATE_TIME"));
$(".trpDirectionLabel").text(localizeString("DIRECTION"));
$(".trpProductHeightLabel").text(localizeString("PRODUCT_HEIGHT_MM"));
$(".trpWaterHeightLabel").text(localizeString("WATER_HEIGHT_MM"));
$(".trpTemperatureLabel").text(localizeString("TEMPERATURE_DEGREES_CELCIUS"));
$(".trpProductVolumeLabel").text(localizeString("PRODUCT_VOLUME_L"));
$(".trpWaterVolumeLabel").text(localizeString("WATER_VOLUME_L"));
$(".trpUllageLabel").text(localizeString("PRODUCT_ULLAGE_L"));
$(".trpTCVolumeLabel").text(localizeString("PRODUCT_TC_VOLUME_L"));
$(".trpDensityLabel").text(localizeString("PRODUCT_DENSITY_KG_M3"));
$(".trpMassLabel").text(localizeString("PRODUCT_MASS_KG"));

//-------------------------------------------------------------------------------------
$('#rpDeviceNumberDiv').removeClass("d-none");
$('#rpDateTimeStartDiv').removeClass("d-none");
$('#rpDateTimeEndDiv').removeClass("d-none");

// Add tank numbers to the list
$('#rpDeviceNumberLabel').text(localizeString("TANK"));
$('#rpDeviceNumberSelect').empty();

// Hide pump controls
$('#rpFuelGradesList').addClass("d-none");
$('#rpUsersList').addClass("d-none");
$('#rpTagsList').addClass("d-none");
$('#rpPumpSummaryReport').addClass("d-none");
    
// Show tank controls
$('#rpTankDirection').removeClass("d-none");

// Clean arrays
commands = [];

// Get configuration
commands.push({
    function: GetUniqueIdentifier
},{
    function: GetTanksConfiguration
},{
    function: GetFuelGradesConfiguration
});
request = createComplexRequest(commands);

// Process response
request.done(function(response) {
    if (responseNull == true)
        return;

    data = response.Packets.filter(Packet => Packet.Type == "UniqueIdentifier");
    if (data != null &&
        data != undefined &&
        data.length > 0) {
        data = data[0].Data;
        if (data == undefined) {
            return;
        } else {
            DEVICE_ID = data.Id;
        }
    }
                          
    data = response.Packets.filter(Packet => Packet.Type == "TanksConfiguration");
    if (data != null &&
        data != undefined &&
        data.length > 0) {
        data = data[0].Data;
        if (data != undefined) {
            if (data.Tanks != undefined &&
                data.Tanks.length > 0) {
                tanksConfigurationData = data.Tanks;
            }
        }
    };
                          
    data = response.Packets.filter(Packet => Packet.Type == "FuelGradesConfiguration");
    if (data != null &&
        data != undefined &&
        data.length > 0) {
        data = data[0].Data;
        if (data != undefined) {
            if (data.FuelGrades != undefined &&
                data.FuelGrades.length > 0) {

                fuelGradesConfigurationData = data.FuelGrades;
                if (tanksConfigurationData != undefined) {
                    for(counter1 = 1; counter1 <= TOTAL_PROBES; counter1++) {
                        if (tanksConfigurationData.find(tanksConfiguration => tanksConfiguration.Id == counter1) != undefined &&
                            tanksConfigurationData.find(tanksConfiguration => tanksConfiguration.Id == counter1).FuelGradeId != undefined) {
                            $('#rpDeviceNumberSelect').append('<option value="' + counter1 + '">' + counter1 + " (" + fuelGradesConfigurationData.find(fuelGrade => fuelGrade.Id == tanksConfigurationData.find(tanksConfiguration => tanksConfiguration.Id == counter1).FuelGradeId).Name + ")" + '</option>');
                        } else {
                            $('#rpDeviceNumberSelect').append('<option value="' + counter1 + '">' + counter1 + '</option>');
                        }
                    }
                }
            }
        }
    };

    if ($('#rpDeviceNumberSelect').length == 0 ||
        ($('#rpDeviceNumberSelect').length == 1 && $('#rpDeviceNumberSelect option:selected').text() == "")) {
        for(counter1 = 1; counter1 <= TOTAL_PROBES; counter1++) {
            $('#rpDeviceNumberSelect').append('<option value="' + counter1 + '">' + counter1 + '</option>');
        }
    }
});

//-------------------------------------------------------------------------------------
// Get report data
$('#rpGenerateReportTanksButton').click(function() {    
    commands = [];
    var reportTitle = "";
                                    
    // Hide tables
    $('#trpTankTable').addClass('d-none');
    $('#trpTankMeasurementsChart').addClass('d-none');

    // Date/time start variables
    var dateTimeStart = "20" + 
                        $('#rpDateTimeStartInput').val().split(' ')[0].split('.')[2] + 
                        "-" + 
                        $('#rpDateTimeStartInput').val().split(' ')[0].split('.')[1] +
                        "-" +
                        $('#rpDateTimeStartInput').val().split(' ')[0].split('.')[0] +
                        "T" +
                        $('#rpDateTimeStartInput').val().split(' ')[1].split(':')[0] +
                        ":" +
                        $('#rpDateTimeStartInput').val().split(' ')[1].split(':')[1] +
                        ":" +
                        $('#rpDateTimeStartInput').val().split(' ')[1].split(':')[2];

    // Date/time end variables
    var dateTimeEnd = "20" + 
                      $('#rpDateTimeEndInput').val().split(' ')[0].split('.')[2] + 
                      "-" + 
                      $('#rpDateTimeEndInput').val().split(' ')[0].split('.')[1] +
                      "-" +
                      $('#rpDateTimeEndInput').val().split(' ')[0].split('.')[0] +
                      "T" +
                      $('#rpDateTimeEndInput').val().split(' ')[1].split(':')[0] +
                      ":" +
                      $('#rpDateTimeEndInput').val().split(' ')[1].split(':')[1] +
                      ":" +
                      $('#rpDateTimeEndInput').val().split(' ')[1].split(':')[2];

    // Validate
    var startDateTime = new Date(dateTimeStart);
    if ((startDateTime instanceof Date) == false || isNaN(startDateTime.valueOf()) == true) {
        showMessage(localizeString("START_DATE_TIME_SET_INCORRECTLY"));
        return;
    }
    var endDateTime = new Date(dateTimeEnd);
    if ((endDateTime instanceof Date) == false || isNaN(endDateTime.valueOf()) == true) {
        showMessage(localizeString("END_DATE_TIME_SET_INCORRECTLY"));
        return;
    }

    // Compare datetimes
    if (startDateTime > endDateTime) {
        showMessage(localizeString("START_DATE_TIME_IS_LATER_THAN_END_DATE_TIME"));
        return;
    }

    $("#trpChart").empty();
    reportData = [];
    if (tankReportingDatatable != null)
        tankReportingDatatable.destroy();

    commands.push({
        function: ReportGetTankMeasurements,
        arguments: [
            $('#rpDeviceNumberSelect').val(),
            dateTimeStart, 
            dateTimeEnd
        ]
    });
    request = createComplexRequest(commands, true, 60000);

    // Process response
    request.done(function(response) {
        if (responseNull != true) {

            // Report data
            data = response.Packets.filter(Packet => Packet.Type == "ReportTankMeasurements");
            if (data != null &&
                data != undefined) {
                data = data[0].Data;
                if (data != undefined) {

                    if (data.length > 0) {
                        
                        counter1 = 0;

                        data.forEach(function(reportDataItem, reportDataItemIndex) {

                            // Check direction
                            currentDirection = 0;
                            if (reportDataItemIndex > 0) {
                                if (parseFloat(reportDataItem.ProductVolume) > parseFloat(previousProductVolume)) {
                                    currentDirection = 1;
                                }
                                else if (parseFloat(reportDataItem.ProductVolume) < parseFloat(previousProductVolume)) {
                                    currentDirection = 2;
                                }
                            }
                            
                            if ($('#rpTankDirectionSelect').val() == 0 ||
                                (parseInt($('#rpTankDirectionSelect').val(), 10) > 0 && parseInt($('#rpTankDirectionSelect').val(), 10) == currentDirection)) {
                                counter1++;
                                reportData.push({
                                    DT_RowId: counter1.toString(),
                                    Line: counter1.toString(),
                                    Datetime: reportDataItem.DateTime.replace(/-/g, ".").replace(/T/g, " "),
                                    Direction: (currentDirection == 1) ? '<i class="fas fa-rotate-180 fa-arrow-down text-success"></i>' : (currentDirection == 2 ? '<i class="fas fa-arrow-down text-danger"></i>' : ""),
                                    ProductHeight: reportDataItem.ProductHeight,
                                    WaterHeight: reportDataItem.WaterHeight,
                                    Temperature: reportDataItem.Temperature,
                                    ProductVolume: reportDataItem.ProductVolume,
                                    WaterVolume: reportDataItem.WaterVolume,
                                    ProductUllage: reportDataItem.ProductUllage,
                                    ProductTCVolume: reportDataItem.ProductTCVolume,
                                    ProductDensity: reportDataItem.ProductDensity,
                                    ProductMass: reportDataItem.ProductMass
                                });
                            }

                            previousProductVolume = reportDataItem.ProductVolume;
                        });

                        if ($('#rpDeviceNumberSelect').val() != 0)
                            reportTitle += " " + localizeString("FOR_TANK").toLowerCase() + " " + $('#rpDeviceNumberSelect option:selected').text();
                        else
                            reportTitle += " " + localizeString("FOR_ALL_TANKS").toLowerCase();

                        reportTitle += ' ' + localizeString("FROM").toLowerCase() + ' ' + $('#rpDateTimeStartInput').val() + ' ' + localizeString("TILL").toLowerCase() + ' ' + $('#rpDateTimeEndInput').val();
                        reportTitle += ", " + localizeString("DEVICE_ID").toLowerCase() + ": " + DEVICE_ID;

                        document.title = localizeString("TANK_LEVEL_CHANGES_REPORT") + reportTitle;
    
                        // Display the chart
                        if ($('#rpTankDirectionSelect').val() == 0 &&
                            reportData.length > 0) {
                            // Display chart
                            $('#trpTankMeasurementsChart').removeClass('d-none');
        
                            chartData = [];
                            maxChartDataItem = Math.max.apply(Math, reportData.map(function(measurements) { return measurements.ProductVolume; }))
                            chartData = reportData.map(function(reportDataItem) {
                                return { value: reportDataItem.ProductVolume, date: reportDataItem.Datetime.replace(".", "-").replace(".", "-").replace(" ", "T") };
                            });
        
                            var data = [{
                                name: "Chart",
                                data: chartData
                            }];
        
                            $tip = $('#trpTip');
                            $tip.hide();
        
                            // Basic
                            options = {
                                height: 300,
                                width: $("#trpTankMeasurementsChart").width(),
                                x: { margin: 15, min: null, max: null },
                                y: { margin: 0.2, min: 0, max: maxChartDataItem },
                                goal: { show: false, value: 23, color: "#3BAFD7" },
                                tooltip: { show: true, maxRadius: 2 },
                                lines: { show: true, fill: true, curve: true, strokeColor: ["#cccccc", "#E1523D"], strokeWidth: 1, fillOpacity: 0.3, fillColor: ["#3BAFD7", "#E1523D"] },
                                points: { show: true, strokeWidth: 3, strokeColor: ["#E1523D", "#3BAFD7"] },
                                labels: {
                                    lineWidth: 0.5,
                                    fontSize: 11,
                                    x: { number: 7, show: true, color: "#000000", grid: true },
                                    y: { number: 4, show: true, color: "#000000", grid: true }
                                }
                            };
        
                            $("#trpChart").chart(data, options, function (tooltip) {
                                if (tooltip.found) {
                                    var pointDate = new Date(tooltip.point.date);
                                    var year = addZero(pointDate.getYear() % 100);
                                    var month = addZero(pointDate.getMonth() + 1);
                                    var date = addZero(pointDate.getDate());
                                    var hours = addZero(pointDate.getHours());
                                    var minutes = addZero(pointDate.getMinutes());
                                    var seconds = addZero(pointDate.getSeconds());
        
                                    $tip.html("<b>" + localizeString("PRODUCT_VOLUME_L") + "</b>: <i>" + tooltip.point.value + "</i><br><b>" + localizeString("DATE_TIME") + "</b>: <i>" + date + "." + month + "." + year + " " + hours + ":" + minutes + ":" + seconds + "</i>");
                                    $tip.css({ left: tooltip.mouse.pageX - 100, top: tooltip.mouse.pageY + 5 }).show();
                                } else {
                                    $tip.hide();
                                }
                            });

                            $("#trpTankMeasurementsChartHeader").html(localizeString("TANK_LEVEL_CHANGES_CHART") + reportTitle);
                        }
                    }

                    $("#trpTankMeasurementsReportHeader").html(localizeString("TANK_LEVEL_CHANGES_REPORT") + reportTitle);
                }
            }
        }

        // Display the table
        $('#trpTankTable').removeClass('d-none');

        // Fill in tanks reporting table
        tankReportingDatatable = $('#trpTank').DataTable({
            "pageLength": 5,
            "ordering": true,
            responsive: true,
            select: true,
            data: reportData,
            columns: [
                { data: 'Line' },
                { data: 'Datetime' },
                { data: 'Direction' },
                { data: 'ProductHeight' },
                { data: 'WaterHeight' },
                { data: 'Temperature' },
                { data: 'ProductVolume' },
                { data: 'WaterVolume' },
                { data: 'ProductUllage' },
                { data: 'ProductTCVolume' },
                { data: 'ProductDensity' },
                { data: 'ProductMass' }
            ],
            columnDefs: [
                {
                    targets: 0,
                    className: 'dt-body-center',
                    "width": '3%'
                },
                {
                    targets: 1,
                    className: 'dt-body-center',
                    "width": '7%'
                },
                {
                    targets: 2,
                    className: 'dt-body-center',
                    "width": '5%'
                },
                {
                    targets: 3,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 4,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 5,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 6,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 7,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 8,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 9,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 10,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 11,
                    className: 'dt-body-center',
                    "width": '5%'
                }
            ],
            dom: '<"clearfix"B>lfrtip',
            buttons: [
                'copyHtml5',
                {
                    extend: 'excelHtml5',
                    footer: true
                },
                'csvHtml5',
                'print'
            ],
            language: {
                url: DATATABLES_LANGUAGE_FILE
            }
        });
    });
});

//-------------------------------------------------------------------------------------