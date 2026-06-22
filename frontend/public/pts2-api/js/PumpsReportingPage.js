// Existing pumps configuration
var reportData = [];
var pumpNozzlesReportData = [];
var pumpNozzlesReportDataItem;
var users = [];
var fuelGrades = [];
var pumpNozzles = [];
var tags = [];

// Pumps reporting DataTable
var pumpsReportingDatatable;
var pumpNozzlesReportingDatatable;

// Localization
$("#rpGenerateReportPumpsButton").val(localizeString("GENERATE_REPORT"));
$(".rpDateTimeStartLabel").text(localizeString("DATE_TIME_START"));
$(".rpDateTimeEndLabel").text(localizeString("DATE_TIME_END"));
$(".rpPumpLabel").text(localizeString("PUMP"));
$(".rpNozzleLabel").text(localizeString("NOZZLE"));
$(".rpTransactionLabel").text(localizeString("TRANSACTION"));
$(".rpPriceLabel").text(localizeString("PRICE"));
$(".rpFilledVolumeLabel").text(localizeString("FILLED_VOLUME_L"));
$(".rpFilledAmountLabel").text(localizeString("FILLED_AMOUNT"));
$(".rpVolumeTotalsLabel").text(localizeString("VOLUME_TOTALS_L"));
$(".rpAmountTotalsLabel").text(localizeString("AMOUNT_TOTALS"));
$(".rpUserLabel").text(localizeString("USER_SHORT"));
$(".rpTagLabel").text(localizeString("TAG"));
$(".rpTotalLabel").text(localizeString("TOTAL") + ":");
$(".rpSummaryFilledVolumeLabel").text(localizeString("SUMMARY_FILLED_VOLUME_L"));
$(".rpSummaryFilledAmountLabel").text(localizeString("SUMMARY_FILLED_AMOUNT"));
$(".rpVolumeTotalsOnStartLabel").text(localizeString("VOLUME_TOTALS_ON_START_L"));
$(".rpVolumeTotalsOnEndLabel").text(localizeString("VOLUME_TOTALS_ON_END_L"));
$(".rpVolumeTotalsDifferenceLabel").text(localizeString("VOLUME_TOTALS_DIFFERENCE_L"));
$(".rpAmountTotalsOnStartLabel").text(localizeString("AMOUNT_TOTALS_ON_START"));
$(".rpAmountTotalsOnEndLabel").text(localizeString("AMOUNT_TOTALS_ON_END"));
$(".rpAmountTotalsDifferenceLabel").text(localizeString("AMOUNT_TOTALS_DIFFERENCE"));
$(".rpAverageFillingSpeedLabel").text(localizeString("AVERAGE_FILLING_SPEED"));

//-------------------------------------------------------------------------------------
$('#rpDeviceNumberDiv').removeClass("d-none");
$('#rpDateTimeStartDiv').removeClass("d-none");
$('#rpDateTimeEndDiv').removeClass("d-none");

// Add pump numbers to the list
$('#rpDeviceNumberLabel').text(localizeString("PUMP"));
$('#rpDeviceNumberSelect').empty();
$('#rpDeviceNumberSelect').append('<option value="0">' + localizeString("ALL") + '</option>');
for(counter1 = 1; counter1 <= TOTAL_PUMPS; counter1++)
    $('#rpDeviceNumberSelect').append('<option value="' + counter1 + '">' + counter1 + '</option>');
    
$('#rpFuelGradeSelect').empty();
$('#rpFuelGradeSelect').append('<option value="0">' + localizeString("ALL") + '</option>');

$('#rpUserSelect').empty();
$('#rpUserSelect').append('<option value="0">' + localizeString("ALL") + '</option>');

$('#rpTagSelect').empty();
$('#rpTagSelect').append('<option value="0">' + localizeString("ALL") + '</option>');
                
// Show pump controls
$('#rpPumpSummaryReport').removeClass("d-none");
    
// Hide tank controls
$('#rpTankDirection').addClass("d-none");
$('#rpTankReconciliationReport').addClass("d-none");
$('#rpTankMeasurementsChart').addClass("d-none");

// Clean arrays
commands = [];

// Get configuration
commands.push({
    function: GetUsersConfiguration,
},{
    function: GetTagsList
},{
    function: GetFuelGradesConfiguration
},{
    function: GetPumpNozzlesConfiguration
},{
    function: GetSystemDecimalDigits
},{
    function: GetUniqueIdentifier
});
request = createComplexRequest(commands);

// Process response
request.done(function(response) {
    if (responseNull == true)
        return;
            
    // Fuel grades configuration
    data = response.Packets.filter(Packet => Packet.Type == "FuelGradesConfiguration");
    if (data != null &&
        data != undefined &&
        data.length > 0) {
        data = data[0].Data;
        if (data == undefined) {
            return;
        } else {

            // Fill in response values
            if (data.FuelGrades.length > 0) {
                fuelGrades = [];
                counter1 = 0;
                data.FuelGrades.forEach(function(fuelGradeDataItem) {
                    counter1++;
                    fuelGrades.push({
                        Id: fuelGradeDataItem.Id,
                        Name: fuelGradeDataItem.Name
                    });
                    $('#rpFuelGradeSelect').append('<option value="' + counter1 + '">' + fuelGradeDataItem.Name + '</option>');
                });
                    
                $('#rpFuelGradesList').removeClass("d-none");
            }
        }
    }
            
    // Pump nozzles configuration
    data = response.Packets.filter(Packet => Packet.Type == "PumpNozzlesConfiguration");
    if (data != null &&
        data != undefined &&
        data.length > 0) {
        data = data[0].Data;
        if (data == undefined) {
            return;
        } else {

            // Fill in response values
            if (data.PumpNozzles.length > 0) {
                pumpNozzles = [];
                data.PumpNozzles.forEach(function(pumpNozzlesDataItem) {
                    pumpNozzles.push({
                        PumpId: pumpNozzlesDataItem.PumpId,
                        FuelGradeIds: pumpNozzlesDataItem.FuelGradeIds
                    });
                });
            }
        }
    }
            
    // Users configuration
    data = response.Packets.filter(Packet => Packet.Type == "UsersConfiguration");
    if (data != null &&
        data != undefined &&
        data.length > 0) {
        data = data[0].Data;
        if (data == undefined) {
            return;
        } else {

            // Fill in response values
            if (data.Users.length > 0) {
                users = [];
                counter1 = 0;
                data.Users.forEach(function(user) {
                    counter1++;
                    users.push({
                        Id: user.Id,
                        Login: user.Login
                    });
                    $('#rpUserSelect').append('<option value="' + counter1 + '">' + user.Login + '</option>');
                });

                // Service users
                users.push({
                    Id: SYSTEM_USER_DART_1_ID,
                    Login: SYSTEM_USER_DART_1_NAME
                });
                $('#rpUserSelect').append('<option value="' + SYSTEM_USER_DART_1_ID.toString() + '">' + localizeString("SYSTEM_USER") + ' ' + SYSTEM_USER_DART_1_NAME + '</option>');
                
                users.push({
                    Id: SYSTEM_USER_DART_2_ID,
                    Login: SYSTEM_USER_DART_2_NAME
                });
                $('#rpUserSelect').append('<option value="' + SYSTEM_USER_DART_2_ID.toString() + '">' + localizeString("SYSTEM_USER") + ' ' + SYSTEM_USER_DART_2_NAME + '</option>');
                
                users.push({
                    Id: SYSTEM_USER_DART_3_ID,
                    Login: SYSTEM_USER_DART_3_NAME
                });
                $('#rpUserSelect').append('<option value="' + SYSTEM_USER_DART_3_ID.toString() + '">' + localizeString("SYSTEM_USER") + ' ' + SYSTEM_USER_DART_3_NAME + '</option>');
                
                users.push({
                    Id: SYSTEM_USER_DART_4_ID,
                    Login: SYSTEM_USER_DART_4_NAME
                });
                $('#rpUserSelect').append('<option value="' + SYSTEM_USER_DART_4_ID.toString() + '">' + localizeString("SYSTEM_USER") + ' ' + SYSTEM_USER_DART_4_NAME + '</option>');

                users.push({
                    Id: SYSTEM_USER_UNIPUMP_ID,
                    Login: SYSTEM_USER_UNIPUMP_NAME
                });
                $('#rpUserSelect').append('<option value="' + SYSTEM_USER_UNIPUMP_ID.toString() + '">' + localizeString("SYSTEM_USER") + ' ' + SYSTEM_USER_UNIPUMP_NAME + '</option>');

                users.push({
                    Id: SYSTEM_USER_PTS_ID,
                    Login: SYSTEM_USER_PTS_NAME
                });
                $('#rpUserSelect').append('<option value="' + SYSTEM_USER_PTS_ID.toString() + '">' + localizeString("SYSTEM_USER") + ' ' + SYSTEM_USER_PTS_NAME + '</option>');
                
                $('#rpUsersList').removeClass("d-none");
            }
        }
    }

    // Tags
    data = response.Packets.filter(Packet => Packet.Type == "TagsList");
    if (data != null &&
        data != undefined &&
        data.length > 0) {
        data = data[0].Data;
        if (data == undefined) {
            return;
        } else {

            // Fill in response values
            if (data.length > 0) {
                tags = [];
                counter1 = 0;
                data.forEach(function(tag) {
                    counter1++;
                    tags.push({
                        Id: tag.Tag,
                        Name: tag.Name
                    });
                    $('#rpTagSelect').append('<option value="' + tag.Tag + '">' + tag.Name + " (" + tag.Tag + ")" + '</option>');
                });
                
                $('#rpTagsList').removeClass("d-none");
            }
        }
    }

    // System decimal digits
    data = response.Packets.filter(Packet => Packet.Type == "SystemDecimalDigits");
    if (data != null &&
        data != undefined &&
        data.length > 0) {
        data = data[0].Data;
        if (data == undefined) {
            return;
        } else {
            SYSTEM_PRICE_DECIMAL_DIGITS = parseInt(data.Price, 10);
            SYSTEM_AMOUNT_DECIMAL_DIGITS = parseInt(data.Amount, 10);
            SYSTEM_VOLUME_DECIMAL_DIGITS = parseInt(data.Volume, 10);
            SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS = parseInt(data.AmountTotal, 10);
            SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS = parseInt(data.VolumeTotal, 10);
        }
    }

    // Unique identifier
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
});

//-------------------------------------------------------------------------------------
// Get pump nozzle product name
function getProductNameByPumpNozzleNumber(pumpNumber, nozzleNumber) {

    var nozzleName = nozzleNumber.toString();

    if (fuelGrades != null ||
        fuelGrades.length > 0 ||
        pumpNozzles != null ||
        pumpNozzles.length > 0) {
        pumpNozzles.forEach(function(pumpNozzleItem) {
            if (parseInt(pumpNozzleItem.PumpId, 10) == pumpNumber) {
                fuelGrades.forEach(function(fuelGradeItem) {
                    if (pumpNozzleItem.FuelGradeIds != undefined &&
                        pumpNozzleItem.FuelGradeIds.length >= nozzleNumber) {
                        if (pumpNozzleItem.FuelGradeIds[nozzleNumber - 1] != undefined &&
                            parseInt(fuelGradeItem.Id, 10) == parseInt(pumpNozzleItem.FuelGradeIds[nozzleNumber - 1], 10)) {
                            nozzleName = nozzleNumber.toString() + " (" + fuelGradeItem.Name + ")";
                        }
                    }
                });
            }
        });
    }

    return nozzleName;
}

//-------------------------------------------------------------------------------------
// Get users configuration and report data
$('#rpGenerateReportPumpsButton').click(function() {
    var nozzleFuelGrade;
    var gradeName = "";
    var reportTitle = "";

    // Clean arrays
    commands = [];

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

    reportData = [];
    if (pumpsReportingDatatable != null)
        pumpsReportingDatatable.destroy();

    pumpNozzlesReportData = [];
    if (pumpNozzlesReportingDatatable != null)
        pumpNozzlesReportingDatatable.destroy();

    // Get firmware information to get list of protocols supported and get pumps configuration
    commands.push({
        function: ReportGetPumpTransactions,
        arguments: [
            $('#rpDeviceNumberSelect').val(),
            dateTimeStart, 
            dateTimeEnd
        ]
    });
    request = createComplexRequest(commands, true, 300000);

    // Process response
    request.done(function(response) {
        if (responseNull != true) {

            // Report data
            data = response.Packets.filter(Packet => Packet.Type == "ReportPumpTransactions");
            if (data != null &&
                data != undefined &&
                data.length > 0) {
                data = data[0].Data;
                if (data != undefined) {

                    if (data.length > 0) {
                        
                        counter1 = 0;
                        counter2 = 0;
                        data.forEach(function(reportDataItem) {
                            // Filter fuel grade
                            nozzleFuelGrade = getProductNameByPumpNozzleNumber(parseInt(reportDataItem.Pump, 10), parseInt(reportDataItem.Nozzle, 10));
                            if (nozzleFuelGrade.includes("(")) {
                                gradeName = nozzleFuelGrade.split("(")[1].slice(0, -1);
                            }
                            if ($('#rpFuelGradeSelect option:selected').val() != 0 &&
                                $('#rpFuelGradeSelect option:selected').text() != gradeName)
                                return;

                            // Filter user
                            if ($('#rpUserSelect option:selected').val() != 0) {
                                if (parseInt(reportDataItem.UserId, 10) == 0)
                                    return;

                                if (users.filter(User => parseInt(User.Id, 10) == parseInt(reportDataItem.UserId, 10)).length == 0)
                                    return;

                                if ($('#rpUserSelect option:selected').text() != users.filter(User => parseInt(User.Id, 10) == parseInt(reportDataItem.UserId, 10))[0].Login)
                                    return;
                            }

                            // Filter tag
                            if ($('#rpTagSelect option:selected').val() != 0) {
                                if (parseInt(reportDataItem.Tag, 16) == 0)
                                    return;

                                if (tags.filter(Tag => parseInt(Tag.Id, 16) == parseInt(reportDataItem.Tag, 16)).length == 0)
                                    return;

                                if ($('#rpTagSelect option:selected').val() != tags.filter(Tag => parseInt(Tag.Id, 16) == parseInt(reportDataItem.Tag, 16))[0].Id)
                                    return;
                            }

                            // Add report objects
                            counter1++;
                            reportData.push({
                                DT_RowId: counter1.toString(),
                                Line: counter1.toString(),
                                DatetimeStart: reportDataItem.DateTimeStart.replace(/-/g, ".").replace(/T/g, " "),
                                DatetimeEnd: reportDataItem.DateTime.replace(/-/g, ".").replace(/T/g, " "),
                                Pump: reportDataItem.Pump,
                                Nozzle: nozzleFuelGrade,
                                Transaction: reportDataItem.Transaction,
                                Volume: reportDataItem.Volume.toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS),
                                TCVolume: (reportDataItem.TCVolume != undefined) ? reportDataItem.TCVolume.toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS) : "-",
                                Amount: reportDataItem.Amount.toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS),
                                TotalVolume: reportDataItem.TotalVolume.toFixed(SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS),
                                TotalAmount: reportDataItem.TotalAmount.toFixed(SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS),
                                Price: reportDataItem.Price.toFixed(SYSTEM_PRICE_DECIMAL_DIGITS),
                                User: (parseInt(reportDataItem.UserId, 10) > 0) ? 
                                        ((users.filter(User => parseInt(User.Id, 10) == parseInt(reportDataItem.UserId, 10)).length > 0) ? 
                                            users.filter(User => parseInt(User.Id, 10) == parseInt(reportDataItem.UserId, 10))[0].Login : "") : 
                                        "",
                                Tag: (parseInt(reportDataItem.Tag, 16) > 0) ? 
                                        ((tags.filter(Tag => parseInt(Tag.Id, 16) == parseInt(reportDataItem.Tag, 16)).length > 0) ? 
                                        (tags.filter(Tag => parseInt(Tag.Id, 16) == parseInt(reportDataItem.Tag, 16))[0].Name + " (" + tags.filter(Tag => parseInt(Tag.Id, 16) == parseInt(reportDataItem.Tag, 16))[0].Id + ")") : reportDataItem.Tag) : 
                                        ""
                            });

                            // Prepare pump nozzles datatable
                            pumpNozzlesReportDataItem = pumpNozzlesReportData.find(x => x.Pump === reportDataItem.Pump &&
                                                                                        x.Nozzle == nozzleFuelGrade);
                            if (pumpNozzlesReportDataItem != undefined) {
                                pumpNozzlesReportDataItem.SummaryFilledVolume = (parseFloat(pumpNozzlesReportDataItem.SummaryFilledVolume) + parseFloat(reportDataItem.Volume)).toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                                pumpNozzlesReportDataItem.SummaryFilledAmount = (parseFloat(pumpNozzlesReportDataItem.SummaryFilledAmount) + parseFloat(reportDataItem.Amount)).toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                                pumpNozzlesReportDataItem.TotalVolumeEnd = reportDataItem.TotalVolume.toFixed(SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS);
                                pumpNozzlesReportDataItem.TotalVolumeDifference = (parseFloat(pumpNozzlesReportDataItem.TotalVolumeEnd) - parseFloat(pumpNozzlesReportDataItem.TotalVolumeStart)).toFixed(SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS);
                                pumpNozzlesReportDataItem.TotalAmountEnd = reportDataItem.TotalAmount.toFixed(SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS);
                                pumpNozzlesReportDataItem.TotalAmountDifference = (parseFloat(pumpNozzlesReportDataItem.TotalAmountEnd) - parseFloat(pumpNozzlesReportDataItem.TotalAmountStart)).toFixed(SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS);
                                pumpNozzlesReportDataItem.TotalFillingSeconds += Math.abs((new Date(reportDataItem.DateTime) - new Date(reportDataItem.DateTimeStart)) / 1000);
                                pumpNozzlesReportDataItem.AverageFillingSpeed = (parseFloat(pumpNozzlesReportDataItem.AverageFillingSpeed) + (parseFloat(reportDataItem.Volume) * 60 / Math.abs(((new Date(reportDataItem.DateTime) - new Date(reportDataItem.DateTimeStart)) / 1000)))).toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                                pumpNozzlesReportDataItem.FillingsCounter++;
                            } else {
                                counter2++;
                                pumpNozzlesReportData.push({
                                    DT_RowId: counter2.toString(),
                                    Line: counter2.toString(),
                                    Pump: reportDataItem.Pump,
                                    Nozzle: nozzleFuelGrade,
                                    SummaryFilledVolume: reportDataItem.Volume.toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS),
                                    SummaryFilledAmount: reportDataItem.Amount.toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS),
                                    TotalVolumeStart: (parseFloat(reportDataItem.TotalVolume) > 0) ? (parseFloat(reportDataItem.TotalVolume) - parseFloat(reportDataItem.Volume)).toFixed(SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS) : reportDataItem.TotalVolume.toFixed(SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS),
                                    TotalVolumeEnd: reportDataItem.TotalVolume.toFixed(SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS),
                                    TotalVolumeDifference: (parseFloat(reportDataItem.TotalVolume - ((parseFloat(reportDataItem.TotalVolume) > 0) ? (parseFloat(reportDataItem.TotalVolume) - parseFloat(reportDataItem.Volume)) : reportDataItem.TotalVolume))).toFixed(SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS),
                                    TotalAmountStart: (parseFloat(reportDataItem.TotalAmount) > 0) ? (parseFloat(reportDataItem.TotalAmount) - parseFloat(reportDataItem.Amount)).toFixed(SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS) : reportDataItem.TotalAmount.toFixed(SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS),
                                    TotalAmountEnd: reportDataItem.TotalAmount.toFixed(SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS),
                                    TotalAmountDifference: (parseFloat(reportDataItem.TotalAmount - ((parseFloat(reportDataItem.TotalAmount) > 0) ? (parseFloat(reportDataItem.TotalAmount) - parseFloat(reportDataItem.Amount)) : reportDataItem.TotalAmount))).toFixed(SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS),
                                    TotalFillingSeconds: Math.abs((new Date(reportDataItem.DateTime) - new Date(reportDataItem.DateTimeStart)) / 1000),
                                    AverageFillingSpeed: (parseFloat(reportDataItem.Volume) * 60 / Math.abs(((new Date(reportDataItem.DateTime) - new Date(reportDataItem.DateTimeStart)) / 1000))).toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS),
                                    FillingsCounter: 1
                                });
                            }
                        });

                        pumpNozzlesReportData.forEach(function(pumpNozzlesReportDataItem) {
                            pumpNozzlesReportDataItem.AverageFillingSpeed = (parseFloat(pumpNozzlesReportDataItem.AverageFillingSpeed) / pumpNozzlesReportDataItem.FillingsCounter).toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                        });

                        reportTitle = " " + localizeString("FOR").toLowerCase();

                        if ($('#rpDeviceNumberSelect').val() != 0)
                            reportTitle += " " + localizeString("PUMP").toLowerCase() + " " + $('#rpDeviceNumberSelect').val();
                        else
                            reportTitle += " " + localizeString("ALL_PUMPS");

                        reportTitle += ' ' + localizeString("FROM").toLowerCase() + ' ' + $('#rpDateTimeStartInput').val() + ' ' + localizeString("TILL").toLowerCase() + ' ' + $('#rpDateTimeEndInput').val();

                        if ($('#rpFuelGradeSelect option:selected').val() != 0)
                            reportTitle += ', ' + localizeString("FUEL_GRADE").toLowerCase() + ' "' + $('#rpFuelGradeSelect option:selected').text() + '"';
                            
                        if ($('#rpUserSelect option:selected').val() != 0)
                            reportTitle += ', ' + localizeString("USER").toLowerCase() + ' "' + $('#rpUserSelect option:selected').text() + '"';
                            
                        if ($('#rpTagSelect option:selected').val() != 0)
                            reportTitle += ', ' + localizeString("TAG").toLowerCase() + ' "' + $('#rpTagSelect option:selected').text() + '"';

                        reportTitle += ", " + localizeString("DEVICE_ID").toLowerCase() + ": " + DEVICE_ID;
                    }

                    $("#trpPumpsTransactionsReportHeader").html(localizeString("PUMPS_TRANSACTIONS_REPORT") + reportTitle);
                }
            }
        }
    
        // Display the table
        $('#prpPumpsTable').removeClass('d-none');
    
        // Fill in pumps reporting table
        pumpsReportingDatatable = $('#prpPumps').DataTable({
            "pageLength": 10,
            "ordering": true,
            responsive: true,
            select: true,
            data: reportData,
            columns: [
                { data: 'Line' },
                { data: 'DatetimeStart' },
                { data: 'DatetimeEnd' },
                { data: 'Pump' },
                { data: 'Nozzle' },
                { data: 'Transaction' },
                { data: 'Price' },
                { data: 'Volume' },
                { data: 'Amount' },
                { data: 'TotalVolume' },
                { data: 'TotalAmount' },
                { data: 'User' },
                { data: 'Tag' }
            ],
            columnDefs: [
                {
                    targets: 0,
                    className: 'dt-body-center',
                    "width": '5%'
                },
                {
                    targets: 1,
                    className: 'dt-body-center',
                    "width": '11%'
                },
                {
                    targets: 2,
                    className: 'dt-body-center',
                    "width": '11%'
                },
                {
                    targets: 3,
                    className: 'dt-body-center',
                    "width": '5%'
                },
                {
                    targets: 4,
                    className: 'dt-body-center',
                    "width": '5%'
                },
                {
                    targets: 5,
                    className: 'dt-body-center',
                    "width": '5%'
                },
                {
                    targets: 6,
                    className: 'dt-body-center',
                    "width": '8%'
                },
                {
                    targets: 7,
                    className: 'dt-body-center',
                    "width": '8%'
                },
                {
                    targets: 8,
                    className: 'dt-body-center',
                    "width": '8%'
                },
                {
                    targets: 9,
                    className: 'dt-body-center',
                    "width": '8%'
                },
                {
                    targets: 10,
                    className: 'dt-body-center',
                    "width": '8%'
                },
                {
                    targets: 11,
                    className: 'dt-body-center',
                    "width": '8%'
                },
                {
                    targets: 12,
                    className: 'dt-body-center',
                    "width": '10%'
                }
            ],
            dom: '<"clearfix"B>lfrtip',
            buttons: [
                {
                    extend: 'copyHtml5',
                    title: localizeString("PUMPS_TRANSACTIONS_REPORT") + reportTitle
                },
                {
                    extend: 'excelHtml5',
                    filename: localizeString("PUMPS_TRANSACTIONS_REPORT") + reportTitle,
                    footer: true
                },
                {
                    extend: 'csvHtml5',
                    filename: localizeString("PUMPS_TRANSACTIONS_REPORT") + reportTitle
                },
                {
                    extend: 'print',
                    title: localizeString("PUMPS_TRANSACTIONS_REPORT") + reportTitle
                }
            ],
            "footerCallback": function (row, data, start, end, display) {
                var api = this.api();
        
                // Total volume over all pages
                var totalVolume = api.column(7).data().reduce(function (a, b) {
                    return (parseFloat(a) + parseFloat(b)).toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                }, 0);
        
                // Total amount over all pages
                var totalAmount = api.column(8).data().reduce(function (a, b) {
                    return (parseFloat(a) + parseFloat(b)).toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                }, 0);
        
                // Update footer
                $(api.column(7).footer()).html(totalVolume);
                $(api.column(8).footer()).html(totalAmount);
            },
            language: {
                url: DATATABLES_LANGUAGE_FILE
            }
        });
    
        // Hide the pump nozzles table
        $('#prpPumpNozzlesTotalsTable').removeClass('d-none');

        // Display the pump nozzles totals table
        $('#prpPumpNozzlesTable').addClass('d-none');

        pumpNozzlesReportingDatatable = $('#prpPumpNozzlesTotals').DataTable({
            "pageLength": parseInt(pumpNozzlesReportData.length, 10),
            "ordering": true,
            responsive: true,
            select: true,
            data: pumpNozzlesReportData,
            columns: [
                { data: 'Line' },
                { data: 'Pump' },
                { data: 'Nozzle' },
                { data: 'SummaryFilledVolume' },
                { data: 'SummaryFilledAmount' },
                { data: 'TotalVolumeStart' },
                { data: 'TotalVolumeEnd' },
                { data: 'TotalVolumeDifference' },
                { data: 'TotalAmountStart' },
                { data: 'TotalAmountEnd' },
                { data: 'TotalAmountDifference' },
                { data: 'AverageFillingSpeed' }
            ],
            columnDefs: [
                {
                    targets: 0,
                    className: 'dt-body-center',
                    "width": '5%'
                },
                {
                    targets: 1,
                    className: 'dt-body-center',
                    "width": '5%'
                },
                {
                    targets: 2,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 3,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 4,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 5,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 6,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 7,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 8,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 9,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 10,
                    className: 'dt-body-center',
                    "width": '9%'
                },
                {
                    targets: 11,
                    className: 'dt-body-center',
                    "width": '9%'
                }
            ],
            dom: '<"clearfix"B>frt',
            buttons: [
                {
                    extend: 'copyHtml5',
                    title: localizeString("PUMPS_NOZZLES_SUMMARY_REPORT") + reportTitle
                },
                {
                    extend: 'excelHtml5',
                    filename: localizeString("PUMPS_NOZZLES_SUMMARY_REPORT") + reportTitle,
                    footer: true
                },
                {
                    extend: 'csvHtml5',
                    filename: localizeString("PUMPS_NOZZLES_SUMMARY_REPORT") + reportTitle
                },
                {
                    extend: 'print',
                    title: localizeString("PUMPS_NOZZLES_SUMMARY_REPORT") + reportTitle
                }
            ],
            "footerCallback": function (row, data, start, end, display) {
                var api = this.api();
        
                // Total volume over all pages
                var totalVolume = api.column(3).data().reduce(function (a, b) {
                    return (parseFloat(a) + parseFloat(b)).toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                }, 0);
        
                // Total amount over all pages
                var totalAmount = api.column(4).data().reduce(function (a, b) {
                    return (parseFloat(a) + parseFloat(b)).toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                }, 0);
        
                // Update footer
                $(api.column(3).footer()).html(totalVolume);
                $(api.column(4).footer()).html(totalAmount);
            },
            language: {
                url: DATATABLES_LANGUAGE_FILE
            }
        });

        $("#trpPumpNozzlesTotalsReportHeader").html(localizeString("PUMPS_NOZZLES_SUMMARY_REPORT") + reportTitle);
    });
});

//-------------------------------------------------------------------------------------