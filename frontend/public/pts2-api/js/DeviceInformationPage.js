var firmwareDateTime = 0;

var pumpProtocolsList = [];
var probeProtocolsList = [];
var priceBoardProtocolsList = [];
var readerProtocolsList = [];

// DataTables
var pumpProtocolsDatatable;
var probeProtocolsDatatable;
var priceBoardProtocolsDatatable;
var readerProtocolsDatatable;

// Localization
$(".dipDeviceInformationLabel").text(localizeString("TAB_DEVICE_INFORMATION"));
$(".dipFirmwareReleaseLabel").text(localizeString("FIRMWARE_RELEASE"));
$(".dipPumpProtocolsLabel").text(localizeString("PUMP_PROTOCOLS"));
$(".dipProbeProtocolsLabel").text(localizeString("PROBE_PROTOCOLS"));
$(".dipPriceBoardProtocolsLabel").text(localizeString("PRICE_BOARD_PROTOCOLS"));
$(".dipReaderProtocolsLabel").text(localizeString("READER_PROTOCOLS"));
$(".dipIndexLabel").text(localizeString("INDEX"));
$(".dipCommunicationProtocolLabel").text(localizeString("COMMUNICATION_PROTOCOL"));
$(".dipBatteryStatusLabel").text(localizeString("BATTERY_STATUS"));
$(".dipCpuTemperatureLabel").text(localizeString("CPU_TEMPERATURE"));
$(".dipDeviceIdentifierLabel").text(localizeString("DEVICE_IDENTIFIER"));
$(".dipSDFlashDiskLabel").text(localizeString("SD_FLASH_DISK"));
$(".dipSystemOperationLabel").text(localizeString("SYSTEM_OPERATION"));
$(".dipGpsReceiverDataLabel").text(localizeString("GPS_RECEIVER_DATA"));

//-------------------------------------------------------------------------------------
// GetDateTime button click handler
$('#dipGetDeviceInformationButton').click(function() {
    // Clean arrays
    commands = [];
    
    // Send request
    commands.push({
        function: GetFirmwareInformation
    },{
        function: GetBatteryVoltage
    },{
        function: GetCpuTemperature
    },{
        function: GetUniqueIdentifier
    },{
        function: GetSdInformation
    },{
        function: GetGpsData
    },{
        function: GetSystemOperationInformation
    });
    request = createComplexRequest(commands);

    // Process response
    request.done(function(response) {
        if (responseNull == true)
            return;

        // Response data
        data = response.Packets.filter(Packet => Packet.Type == "FirmwareInformation");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {
                // Append firmware date/time
                $('#firmwareRelease').empty();
                $('#firmwareRelease').append("<i><b>" + localizeString("RELEASE_DATETIME") + "</b>:</i> " + data.DateTime[0] + data.DateTime[1] + data.DateTime[2] + data.DateTime[3] + "." + data.DateTime[5] + data.DateTime[6] + "." + data.DateTime[8] + data.DateTime[9] + " " + data.DateTime[11] + data.DateTime[12] + ":" + data.DateTime[14] + data.DateTime[15] + ":" + data.DateTime[17] + data.DateTime[18]);

                // Append pump protocols information
                counter = 1;
                configurationPumpProtocolsList = getPtsConfigPumpProtocolsList();
                if (configurationPumpProtocolsList.length > 0) {
                    pumpProtocolsList = [];
                    configurationPumpProtocolsList.forEach(function(protocolListItem) {
                        data.PumpProtocols.forEach(function(pumpProtocol) {
                            if (parseInt(protocolListItem.index, 10) == parseInt(pumpProtocol, 10)) {
                                pumpProtocolsList.push({
                                    DT_RowId: counter,
                                    index: protocolListItem.index,
                                    communicationProtocol: protocolListItem.value
                                });

                                counter++;
                            }
                        });
                    });
                }
    
                // Destroy datatable
                if (pumpProtocolsDatatable != null)
                    pumpProtocolsDatatable.destroy();

                // Fill in pump protocols table
                pumpProtocolsDatatable = $('#pumpProtocols').DataTable({    
                    dom: 'tip',
                    "ordering": false,
                    responsive: true,
                    data: pumpProtocolsList,
                    columns: [
                        { data: 'index' },
                        { data: 'communicationProtocol' }
                    ],
                    columnDefs: [
                        {
                            targets: 0,
                            className: 'dt-body-center',
                            "width": '10%'
                        },
                        {
                            targets: 1,
                            "width": '90%'
                        }
                    ],
                    language: {
                        url: DATATABLES_LANGUAGE_FILE
                    }
                });

                // Append probe protocols information
                counter = 1;                
                configurationProbeProtocolsList = getPtsConfigProbeProtocolsList();
                if (configurationProbeProtocolsList.length > 0) {
                    probeProtocolsList = [];
                    configurationProbeProtocolsList.forEach(function(protocolListItem) {
                        data.ProbeProtocols.forEach(function(probeProtocol) {
                            if (parseInt(protocolListItem.index, 10) == parseInt(probeProtocol, 10)) {
                                probeProtocolsList.push({
                                    DT_RowId: counter,
                                    index: protocolListItem.index,
                                    communicationProtocol: protocolListItem.value
                                });

                                counter++;
                            }
                        });
                    });
                }

                // Destroy datatable
                if (probeProtocolsDatatable != null)
                    probeProtocolsDatatable.destroy();                

                // Fill in probe protocols table
                probeProtocolsDatatable = $('#probeProtocols').DataTable({    
                    dom: 'tip',
                    "ordering": false,
                    responsive: true,
                    data: probeProtocolsList,
                    columns: [
                        { data: 'index' },
                        { data: 'communicationProtocol' }
                    ],
                    columnDefs: [
                        {
                            targets: 0,
                            className: 'dt-body-center',
                            "width": '10%'
                        },
                        {
                            targets: 1,
                            "width": '90%'
                        }
                    ],
                    language: {
                        url: DATATABLES_LANGUAGE_FILE
                    }
                });
            }

            // Append price board protocols information
            counter = 1;  
            configurationPriceBoardProtocolsList = getPtsConfigPriceBoardProtocolsList(); 
            if (configurationPriceBoardProtocolsList.length > 0) {
                priceBoardProtocolsList = [];
                configurationPriceBoardProtocolsList.forEach(function(protocolListItem) {
                    data.PriceBoardProtocols.forEach(function(priceBoardProtocol) {
                        if (parseInt(protocolListItem.index, 10) == parseInt(priceBoardProtocol, 10)) {
                            priceBoardProtocolsList.push({
                                DT_RowId: counter,
                                index: protocolListItem.index,
                                communicationProtocol: protocolListItem.value
                            });

                            counter++;
                        }
                    });
                });
            }

            // Destroy datatable
            if (priceBoardProtocolsDatatable != null)
                priceBoardProtocolsDatatable.destroy();                

            // Fill in price board protocols table
            priceBoardProtocolsDatatable = $('#priceBoardProtocols').DataTable({    
                dom: 'tip',
                "ordering": false,
                responsive: true,
                data: priceBoardProtocolsList,
                columns: [
                    { data: 'index' },
                    { data: 'communicationProtocol' }
                ],
                columnDefs: [
                    {
                        targets: 0,
                        className: 'dt-body-center',
                        "width": '10%'
                    },
                    {
                        targets: 1,
                        "width": '90%'
                    }
                ],
                language: {
                    url: DATATABLES_LANGUAGE_FILE
                }
            });

            // Append reader protocols information
            counter = 1;
            configurationReaderProtocolsList = getPtsConfigReaderProtocolsList();
            if (configurationReaderProtocolsList.length > 0) {
                readerProtocolsList = [];
                configurationReaderProtocolsList.forEach(function(protocolListItem) {
                    data.ReaderProtocols.forEach(function(readerProtocol) {
                        if (parseInt(protocolListItem.index, 10) == parseInt(readerProtocol, 10)) {
                            readerProtocolsList.push({
                                DT_RowId: counter,
                                index: protocolListItem.index,
                                communicationProtocol: protocolListItem.value
                            });

                            counter++;
                        }
                    });
                });
            }

            // Destroy datatable
            if (readerProtocolsDatatable != null)
                readerProtocolsDatatable.destroy();                

            // Fill in reader protocols table
            readerProtocolsDatatable = $('#readerProtocols').DataTable({    
                dom: 'tip',
                "ordering": false,
                responsive: true,
                data: readerProtocolsList,
                columns: [
                    { data: 'index' },
                    { data: 'communicationProtocol' }
                ],
                columnDefs: [
                    {
                        targets: 0,
                        className: 'dt-body-center',
                        "width": '10%'
                    },
                    {
                        targets: 1,
                        "width": '90%'
                    }
                ],
                language: {
                    url: DATATABLES_LANGUAGE_FILE
                }
            });
        }

        data = response.Packets.filter(Packet => Packet.Type == "BatteryVoltage");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {
                $('#batteryStatus').empty();
                $('#batteryStatus').append("<i><b>" + localizeString("BATTERY_VOLTAGE") + "</b>:</i> " + parseFloat(data.Voltage / 1000).toFixed(3).toString() + " " + localizeString("MV") + "<br/>");

                // Check battery voltage
                if (data.Voltage <= 2000) {
                    $('#batteryStatus').append("<i class='text-danger'><b>" + localizeString("NO_BATTERY_FOUND_PLEASE_PLACE_BATTERY") + "</b></i>");
                } else if (data.Voltage >= 3300) {
                    $('#batteryStatus').append("<i class='text-success'><b>" + localizeString("BATTERY_IS_OK") + "</b></i>");
                } else if (data.Voltage >= 3000) {
                    $('#batteryStatus').append("<i class='text-success'><b>" + localizeString("BATTERY_IS_OK") + "</b></i>");
                } else if (data.Voltage >= 2500) {
                    $('#batteryStatus').append("<i class='text-warning'><b>" + localizeString("BATTERY_NEEDS_REPLACEMENT_SOON") + "</b></i>");
                } else if (data.Voltage >= 2200) {
                    $('#batteryStatus').append("<i class='text-danger'><b>" + localizeString("BATTERY_DISCHARGED_ERROR") + "</b></i>");
                }
            }
        }

        data = response.Packets.filter(Packet => Packet.Type == "CpuTemperature");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {
                $('#cpuTemperature').empty();
                $('#cpuTemperature').append("<i><b>" + localizeString("CPU_TEMPERATURE") + "</b>:</i> " + parseInt(data.Temperature).toString() + " " + localizeString("DEGREES_CELCIUS") + "<br/>");
            }
        }

        data = response.Packets.filter(Packet => Packet.Type == "UniqueIdentifier");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {
                $('#deviceIdentifier').empty();
                $('#deviceIdentifier').append("<i><b>ID</b>:</i> " + data.Id.toString());
            }
        }

        data = response.Packets.filter(Packet => Packet.Type == "GpsData");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {
                $('#dipGpsReceiverData').empty();
                if (data.Status != undefined &&
                    data.Status == "Valid") {
                    $('#dipGpsReceiverData').append("<i><b>" + localizeString("DATE_TIME") + "</b>:</i> " + data.DateTime.charAt(8) + data.DateTime.charAt(9) + "." + 
                                                                                                            data.DateTime.charAt(5) + data.DateTime.charAt(6) + "." + 
                                                                                                            data.DateTime.charAt(0) + data.DateTime.charAt(1) + data.DateTime.charAt(2) + data.DateTime.charAt(3) + " " +
                                                                                                            data.DateTime.charAt(11) + data.DateTime.charAt(12) + ":" + 
                                                                                                            data.DateTime.charAt(14) + data.DateTime.charAt(15) + ":" + 
                                                                                                            data.DateTime.charAt(17) + data.DateTime.charAt(18));
                    $('#dipGpsReceiverData').append("<br/><i><b>" + localizeString("LATITUDE") + "</b>:</i> " + data.Latitude + " " + localizeString("DD_MM_mmmm") + " " + ((data.NorthSouthIndicator == "North") ? localizeString("NORTH_LATITUDE_INDICATOR") : localizeString("SOUTH_LATITUDE_INDICATOR")));
                    $('#dipGpsReceiverData').append("<br/><i><b>" + localizeString("LONGITUDE") + "</b>:</i> " + data.Longitude + " " + localizeString("DDD_MM_mmmm") + " " + ((data.EastWestIndicator == "East") ? localizeString("EAST_LONGITUDE_INDICATOR") : localizeString("WEST_LONGITUDE_INDICATOR")));
                    $('#dipGpsReceiverData').append("<br/><i><b>" + localizeString("SPEED_OVER_GROUND") + "</b>:</i> " + data.SpeedOverGround + " " + localizeString("KM_PER_HOUR"));
                    $('#dipGpsReceiverData').append("<br/><i><b>" + localizeString("COURSE_OVER_GROUND") + "</b>:</i> " + data.CourseOverGround + "°");
                    $('#dipGpsReceiverData').append("<br/><i><b>" + localizeString("MODE") + "</b>:</i> " + ((data.Mode == "Autonomous") ? localizeString("AUTONOMOUS_MODE") : localizeString("DGPS")));
                } else if (data.Status != undefined &&
                           data.Status == "Invalid") {
                    $('#dipGpsReceiverData').append("<i><b>" + localizeString("STATUS") + "</b>:</i> " + localizeString("INVALID_DATA"));
                } else {
                    $('#dipGpsReceiverData').append("<i><b>" + localizeString("STATUS") + "</b>:</i> " + localizeString("GPS_MODULE_IS_ABSENT"));
                }
            }
        }

        data = response.Packets.filter(Packet => Packet.Type == "SystemOperationInformation");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {

                // System information
                if (data.Tasks != undefined) {
                    if (data.Tasks.length > 0) {

                        $("#dipSystemTasks").empty();
                        $("#dipSystemTasks").append("<tr class='table-primary'><th scope='col' class='text-center p-0'>#</th><th scope='col' class='text-left p-0'>" + TASK_NAME_STRING + "</th><th scope='col' class='text-center p-0'>" + TASK_PRIORITY_STRING + "</th><th scope='col' class='text-center p-0'>" + TASK_STATE_STRING + "</th><th scope='col' class='text-center p-0'>" + TASK_STACK_HIGH_WATERMARK_STRING + "</th></tr>");
                        data.Tasks.sort((a,b) => (a.Name > b.Name) ? 1 : ((b.Name > a.Name) ? -1 : 0)).forEach(function(task, counter) {
                            $("#dipSystemTasks").append("<tr>");

                            // Record number
                            $("#dipSystemTasks").append("<th scope='row' class='text-center font-weight-bold p-0'>" + (counter + 1).toString() + "</td>");
                            
                            // Task name
                            $("#dipSystemTasks").append("<td class='text-left font-weight-bold font-italic p-0'>" + task.Name + "</td>");
                            
                            // Task priority
                            $("#dipSystemTasks").append("<td class='text-center p-0'>" + task.Priority.toString() + "</td>");
                            
                            // Task state
                            $("#dipSystemTasks").append("<td class='text-center p-0'>" + task.State + "</td>");
                            
                            // Task stack high watermark
                            $("#dipSystemTasks").append("<td class='text-center p-0'>" + task.StackHighWaterMark.toString() + "</td>");

                            $("#dipSystemTasks").append("</tr>");
                        });
                    }
                }
                $("#dipSystemInfo").empty();
                if (data.CurrentHeapFreeSize != undefined) {
                    $("#dipSystemInfo").append("<b>" + TASK_CURRENT_HEAP_FREE_SIZE + "</b>: <i>" + data.CurrentHeapFreeSize.toString() + " B</i><br>");
                }
                if (data.MinimalHeapFreeSize != undefined) {
                    $("#dipSystemInfo").append("<b>" + TASK_MINIMAL_HEAP_FREE_SIZE + "</b>: <i>" + data.MinimalHeapFreeSize.toString() + " B</i><br>");
                }
                if (data.SystemUpTime != undefined) {
                    var systemUpTimeMs = parseInt(data.SystemUpTime, 10);
                    var systemUpTimeDays = (systemUpTimeMs / (60 * 60 * 24 * 1000));
                    var systemUpTimeHours = ((systemUpTimeMs / (60 * 60 * 1000)) % 24);
                    var systemUpTimeMinutes = ((systemUpTimeMs / (60 * 1000)) % 60);
                    var systemUpTimeSeconds = ((systemUpTimeMs / 1000) % 60);
                    $("#dipSystemInfo").append("<a data-toggle='collapse' href='#collapseSystemTasks' role='button' aria-expanded='false' aria-controls='collapseSystemTasks' class='text-body text-decoration-none' style='cursor:text;'><b>" + TASK_SYSTEM_UP_TIME + "</b></a>: <i>" + Math.floor(systemUpTimeDays).toString() + " " + localizeString("DAYS") + ", " + Math.floor(systemUpTimeHours).toString() + " " + localizeString("HOURS") + ", " + Math.floor(systemUpTimeMinutes).toString() + " " + localizeString("MINUTES") + ", " + Math.floor(systemUpTimeSeconds).toString() + " " + localizeString("SECONDS") + "</i>");
                }
            }
        }

        data = response.Packets.filter(Packet => Packet.Type == "SdInformation");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            $('#sdInformation').empty();
            if (data[0].Error != undefined &&
                data[0].Error == true) {
                if (data[0].Message != undefined)
                    $('#sdInformation').append("<p class='text-danger'><b>" + localizeString("ERROR") + ": " + localizeString(data[0].Message) + "</b></p>");
            } else {
                data = data[0].Data;
                if (data == undefined)
                    return;
            
                $('#sdInformation').append("<i><b>" + localizeString("USED_MEMORY") + "</b>:</i> " + (data.TotalMemoryKB - data.FreeMemoryKB).toString() + " KB" + "<br/>");
                //$('#sdInformation').append("<i><b>" + localizeString("FREE_MEMORY") + "</b>:</i> " + parseInt(data.FreeMemoryKB / 1024 / 1024, 10).toString() + " GB" + "<br/>");
                $('#sdInformation').append("<i><b>" + localizeString("TOTAL_MEMORY") + "</b>:</i> " + Math.round(data.TotalMemoryKB / 1000 / 1000).toString() + " GB" + "<br/><br/>");
                
                // Files
                try {
                    if (data.Files != undefined &&
                        data.Files.length > 0) {
                        data.Files.sort(compare);
                        $('#sdInformation').append("<i><u>" + localizeString("FILES") + "</u>:</i>");
                        data.Files.forEach(function(file, counter) {
                            $('#sdInformation').append("<br/> " + (counter + 1).toString() + ". <b><i>" + file.Name + "</i></b>: " + file.Size + " B (<a href='/" + file.Name + "' class='font-italic'><u>" + localizeString("DOWNLOAD") + "</u></a>,&nbsp;<a onclick='SdFileDelete(\"" + file.Name + "\")' class='font-italic cursorPointer'><u>" + localizeString("DELETE").toLowerCase() + "</u></a>)");
                        });
                    } else 
                        $('#sdInformation').append("<i>" + localizeString("NO_FILES_FOUND") + "</i>");
                } catch(error) {
                    $('#sdInformation').append("<i>" + localizeString("SD_HAS_ERROR") + "</i>");
                    console.log(localizeString("ERROR") + ": " + error);
                }
            }
        }

        data = response.Packets.filter(Packet => Packet.Type == "GetSdInformation");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            $('#sdInformation').empty();
            if (data[0].Error != undefined &&
                data[0].Error == true) {
                if (data[0].Message != undefined)
                    $('#sdInformation').append("<p class='text-danger'><b>" + localizeString("ERROR") + ": " + localizeString(data[0].Message) + "</b></p>");
            }
        }
    });
});

//-------------------------------------------------------------------------------------
function SdFileDelete(filename) {

    if (confirm(localizeString("DO_YOU_REALLY_WANT_TO_DELETE_FILE") + " '" + filename + "'?") == false)
        return false;
    
    // Clean arrays
    commands = [];
    
    // Send request
    commands.push({
        function: FileDelete,
        arguments: [
            filename
        ]
    });
    request = createComplexRequest(commands);

    // Process response
    request.done(function(response) {
        if (responseNull == true)
            return true;

        // Response data
        data = response.Packets.filter(Packet => Packet.Message == "OK");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            $('#dipGetDeviceInformationButton').click();
        }
    });

    return true;
}

//-------------------------------------------------------------------------------------

// Automatically get device information at switching to page
$('#dipGetDeviceInformationButton').click();