var reportData = [];

// GPS reporting DataTable
var gpsReportingDatatable;

// Localization
$("#rpGenerateReportGpsButton").val(localizeString("GENERATE_REPORT"));
$(".trpDateTimeLabel").text(localizeString("DATE_TIME"));
$(".trpLatitudeLabel").text(localizeString("LATITUDE"));
$(".trpNorthSouthIndicatorLabel").text(localizeString("NORTH_SOUTH_INDICATOR"));
$(".trpLongitudeLabel").text(localizeString("LONGITUDE"));
$(".trpEastWestIndicatorLabel").text(localizeString("EAST_WEST_INDICATOR"));
$(".trpSpeedOverGroundLabel").text(localizeString("SPEED_OVER_GROUND"));
$(".trpCourseOverGroundLabel").text(localizeString("COURSE_OVER_GROUND"));
$(".trpModeLabel").text(localizeString("MODE"));

//-------------------------------------------------------------------------------------
$('#rpDeviceNumberDiv').addClass("d-none");
$('#rpDateTimeStartDiv').removeClass("d-none");
$('#rpDateTimeEndDiv').removeClass("d-none");

// Hide pump controls
$('#rpFuelGradesList').addClass("d-none");
$('#rpUsersList').addClass("d-none");
$('#rpTagsList').addClass("d-none");
$('#rpPumpSummaryReport').addClass("d-none");
    
// Hide tank controls
$('#rpTankDirection').addClass("d-none");

//-------------------------------------------------------------------------------------
// Get report data
$('#rpGenerateReportGpsButton').click(function() {    
    commands = [];
    var reportTitle = "";
                                    
    // Hide tables
    $('#trpGpsTable').addClass('d-none');

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

    commands.push({
        function: ReportGetGpsRecords,
        arguments: [
            dateTimeStart, 
            dateTimeEnd
        ]
    });
    request = createComplexRequest(commands, true, 60000);

    // Process response
    request.done(function(response) {
        if (responseNull != true) {

            // Report data
            data = response.Packets.filter(Packet => Packet.Type == "ReportGpsRecords");
            if (data != null &&
                data != undefined) {
                data = data[0].Data;
                if (data != undefined) {

                    if (data.length > 0) {
                        
                        counter = 0;

                        data.forEach(function(reportDataItem, reportDataItemIndex) {
                            counter++;
                            reportData.push({
                                DT_RowId: counter.toString(),
                                Line: counter.toString(),
                                Datetime: reportDataItem.DateTime.replace(/-/g, ".").replace(/T/g, " "),
                                Latitude: reportDataItem.Latitude,
                                NorthSouthIndicator: reportDataItem.NorthSouthIndicator,
                                Longitude: reportDataItem.Longitude,
                                EastWestIndicator: reportDataItem.EastWestIndicator,
                                SpeedOverGround: reportDataItem.SpeedOverGround,
                                CourseOverGround: reportDataItem.CourseOverGround,
                                Mode: reportDataItem.Mode
                            });
                        });

                        reportTitle += ' ' + localizeString("FROM").toLowerCase() + ' ' + $('#rpDateTimeStartInput').val() + ' ' + localizeString("TILL").toLowerCase() + ' ' + $('#rpDateTimeEndInput').val();
                        reportTitle += ", " + localizeString("DEVICE_ID").toLowerCase() + ": " + DEVICE_ID;

                        document.title = localizeString("GPS_COORDINATES_REPORT") + reportTitle;
                    }

                    $("#trpGpsRecordsReportHeader").html(localizeString("GPS_COORDINATES_REPORT") + reportTitle);
                }
            }
        }

        // Display the table
        $('#trpGpsTable').removeClass('d-none');

        // Fill in GPS reporting table
        gpsReportingDatatable = $('#trpGps').DataTable({
            "pageLength": 5,
            "ordering": true,
            responsive: true,
            select: true,
            data: reportData,
            columns: [
                { data: 'Line' },
                { data: 'Datetime' },
                { data: 'Latitude' },
                { data: 'NorthSouthIndicator' },
                { data: 'Longitude' },
                { data: 'EastWestIndicator' },
                { data: 'SpeedOverGround' },
                { data: 'CourseOverGround' },
                { data: 'Mode' }
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
                    "width": '15%'
                },
                {
                    targets: 2,
                    className: 'dt-body-center',
                    "width": '15%'
                },
                {
                    targets: 3,
                    className: 'dt-body-center',
                    "width": '10%'
                },
                {
                    targets: 4,
                    className: 'dt-body-center',
                    "width": '15%'
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