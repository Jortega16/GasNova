// Localization
$(".pcpAmountLabel").text(localizeString("AMOUNT"));
$(".pcpVolumeLabel").text(localizeString("VOLUME"));
$(".pcpPriceLabel").text(localizeString("PRICE"));
$(".pcpNozzleShortLabel").text(localizeString("NOZZLE_SHORT"));
$(".pcpPumpStartButton").text(localizeString("START"));
$(".pcpPumpStopButton").text(localizeString("STOP"));
$("#pcpAuthorizeModalLabel").text(localizeString("CONFIRM_START"));
$(".pcpPumpLabel").text(localizeString("PUMP"));
$(".pcpTypeLabel").text(localizeString("TYPE"));
$(".pcpAuthDlgPumpPresetValueLabel").text(localizeString("DOSE"));
$("#pcpAuthDlgStartButton").text(localizeString("START"));
$(".pcpCancelButton").text(localizeString("CANCEL"));

$("#pcpAuthDlgPumpMode").empty();
$("#pcpAuthDlgPumpMode").append("<option value='Volume'>" + localizeString("VOLUME") + "</option>");
$("#pcpAuthDlgPumpMode").append("<option value='Amount'>" + localizeString("AMOUNT") + "</option>");
$("#pcpAuthDlgPumpMode").append("<option value='FullTank'>" + localizeString("FULL_TANK") + "</option>");
$("#pcpAuthDlgPumpMode").val("Volume");

// Get all configurations
initConfiguration();

//-------------------------------------------------------------------------------------
function initConfiguration() {

    $("#pcpNoPumps").addClass("d-none");
    $("#pcpPumps").addClass("d-none");
    $("#pcpPumps").empty();
    $("#pcpView").addClass("d-none");

    clearTimeout(timerPumpsPollingId);

    // Clean arrays
    commands = [];

    // Get firmware information to get list of protocols supported and get pumps configuration
    commands.push({
        function: GetPumpsConfiguration
    },{
        function: GetSystemDecimalDigits
    },{
        function: GetFuelGradesConfiguration
    },{
        function: GetPumpNozzlesConfiguration
    },{
        function: GetConfigurationIdentifier
    },{
        function: GetUserInformation
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
                    data.FuelGrades.forEach(function(fuelGradeDataItem) {
                        fuelGrades.push({
                            Id: fuelGradeDataItem.Id,
                            Name: fuelGradeDataItem.Name,
                            Price: fuelGradeDataItem.Price
                        });
                    });
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
        
        // Pumps configuration
        data = response.Packets.filter(Packet => Packet.Type == "PumpsConfiguration");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {

                // Set pumps configuration
                if (data.Pumps.length > 0) {
                    pumps = [];
                    data.Pumps.forEach(function(pumpData) {
                        if (parseInt(pumpData.Port, 10) != 0 && parseInt(pumpData.Address, 10) != 0) {
                            
                            // Add pumps objects
                            pumps.push(new Pump(parseInt(pumpData.Id, 10), "OFFLINE"));
                        }
                    });

                    // Show pumps
                    if (pumps.length > 0) {                        
                        $("#pcpPumps").removeClass("d-none");
                        $("#pcpView").removeClass("d-none");
                        $("#pcpNoPumps").addClass("d-none");

                        // Draw pump
                        pumps.forEach(function(pump) {
                            Pump.Draw(pump);
                        });
                    } else {
                        // Hide pumps
                        $("#pcpNoPumps").removeClass("d-none");
                        $("#pcpView").addClass("d-none");
                        return;
                    }
                } else {
                    // Hide pumps
                    $("#pcpNoPumps").removeClass("d-none");
                    $("#pcpView").addClass("d-none");
                    return;
                }

                if (pumps.length > 0) {
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
                                data.PumpNozzles.forEach(function(pumpNozzleDataItem) {

                                    if (parseInt(pumpNozzleDataItem.PumpId, 10) > 0) {
                                        pump = pumps.filter(pump => pump.Id == parseInt(pumpNozzleDataItem.PumpId, 10))[0];
                                        if (pump != null) {

                                            removePumpNozzleGrades(pump);

                                            fuelGrades.forEach(function(fuelGradeDataItem) {

                                                if (pumpNozzleDataItem.FuelGradeIds != undefined) {
        
                                                    if (pumpNozzleDataItem.FuelGradeIds[0] != undefined &&
                                                        parseInt(fuelGradeDataItem.Id, 10) == parseInt(pumpNozzleDataItem.FuelGradeIds[0], 10)) {
                                                        Pump.SetGradeData(pump, 1, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                        addPumpNozzleGrade(pump, 1, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                    }
        
                                                    if (pumpNozzleDataItem.FuelGradeIds[1] != undefined &&
                                                        parseInt(fuelGradeDataItem.Id, 10) == parseInt(pumpNozzleDataItem.FuelGradeIds[1], 10)) {
                                                        Pump.SetGradeData(pump, 2, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                        addPumpNozzleGrade(pump, 2, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                    }
        
                                                    if (pumpNozzleDataItem.FuelGradeIds[2] != undefined &&
                                                        parseInt(fuelGradeDataItem.Id, 10) == parseInt(pumpNozzleDataItem.FuelGradeIds[2], 10)) {
                                                        Pump.SetGradeData(pump, 3, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                        addPumpNozzleGrade(pump, 3, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                    }
        
                                                    if (pumpNozzleDataItem.FuelGradeIds[3] != undefined &&
                                                        parseInt(fuelGradeDataItem.Id, 10) == parseInt(pumpNozzleDataItem.FuelGradeIds[3], 10)) {
                                                        Pump.SetGradeData(pump, 4, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                        addPumpNozzleGrade(pump, 4, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                    }
        
                                                    if (pumpNozzleDataItem.FuelGradeIds[4] != undefined &&
                                                        parseInt(fuelGradeDataItem.Id, 10) == parseInt(pumpNozzleDataItem.FuelGradeIds[4], 10)) {
                                                        Pump.SetGradeData(pump, 5, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                        addPumpNozzleGrade(pump, 5, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                    }
        
                                                    if (pumpNozzleDataItem.FuelGradeIds[5] != undefined && 
                                                        parseInt(fuelGradeDataItem.Id, 10) == parseInt(pumpNozzleDataItem.FuelGradeIds[5], 10)) {
                                                        Pump.SetGradeData(pump, 6, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                        addPumpNozzleGrade(pump, 6, fuelGradeDataItem.Name, fuelGradeDataItem.Price);
                                                    }
                                                }
                                            });

                                            checkPumpNozzleGrades(pump);
                                        }
                                    }
                                });

                                pumps.forEach(function(pump) {
                                    checkPumpNozzleGrades(pump);
                                });
                            } else {
                                pumps.forEach(function(pump) {
                                    checkPumpNozzleGrades(pump);
                                });
                            }
                        }
                    }
                }
            }
        }
                
        // Configuration identifier
        data = response.Packets.filter(Packet => Packet.Type == "ConfigurationIdentifier");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {

                // Fill in response values
                if (data.Id != undefined) {
                    configurationId = data.Id;
                }
            }
        }

        data = response.Packets.filter(Packet => Packet.Type == "UserInformation");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {

                if (data.Permissions != undefined)
                    currentUserPermissions = data.Permissions;

                if (currentUserPermissions["Control"] == true && currentUserPermissions["Configuration"] == true) {
                    $('#pcpTab').removeClass("d-none");
                }
            }
        }

        // Start polling pumps
        if (pumps.length > 0) {
            configurationReceived = 1;
            pollPumps();
        }
    });
}

//-------------------------------------------------------------------------------------
// Poll pumps
function pollPumps() {

    // Clean arrays
    commands = [];

    // Stop operation on any other page
    if (window.location.href.indexOf("PumpsControlPage") == -1) {
        clearTimeout(timerPumpsPollingId);
        return;
    }

    if (pumps.length > 0) {
        pumps.forEach(function(pumpData) {
            commands.push({
                function: PumpGetStatus,
                arguments: [
                    pumpData.Id
                ]
            });
        });

        // Get configuration identifier
        commands.push({
            function: GetConfigurationIdentifier
        });
        
        // Send request
        request = createComplexRequest(commands, false);

        // Process response
        CheckResponse(request);
    }
}

//-------------------------------------------------------------------------------------
function CheckResponse(request) {
    
    var data;
    
    // Process response
    request.done(function(response) {
        failureResponsesCounter = 0;
        
        if (responseNull == true)
            return;
        
        // Request result is OK
        if (response.Packets.length == 1 &&
            response.Packets[0].Message != undefined && 
            response.Packets[0].Message == "OK") {
            return;
        }

        // Loop through all response packets
        response.Packets.forEach(function(packet) {
            if (packet == undefined ||
                packet == null)
                return;

            if (packet.Error != undefined &&
                packet.Error == true &&
                packet.Message != undefined &&
                packet.Message !== "") {
                showMessage(localizeString(packet.Message));
                return;
            }

            if (packet.Type == "ConfigurationIdentifier") {
                data = packet.Data;
                if (data == undefined) {
                    return;
                } else {
                    if (data.Id != undefined &&
                        configurationId != data.Id) {

                        // Get all configurations
                        initConfiguration();
                    } else {
                        clearTimeout(timerPumpsPollingId);
                        timerPumpsPollingId = setTimeout(pollPumps, 1000);
                    }
                }
            } else if (packet.Type == "PumpAuthorizeConfirmation") {
                // Do nothing
            } else if (packet.Type == "PumpEmergencyStop") {
                // Do nothing
            } else {
                if (packet.Data == undefined ||
                    packet.Data == null)
                    return;

                if (packet.Data.Pump == undefined ||
                    packet.Data.Pump == null)
                    return;

                // Get current pump from response
                var pump = pumps.filter(x => parseInt(x.Id, 10) == parseInt(packet.Data.Pump, 10))[0];

                if (pump != null) {

                    if (packet.Data.User != undefined) {
                        if (pump.User == $(".usernameSpanLg").text() &&
                            packet.Data.User != pump.User) {
                            pump.OrderAmount = 0;
                            pump.OrderVolume = 0;
                            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpProgress").attr("style", "width:0%");
                            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpProgress").attr("aria-valuenow", "0");
                        }
                    }

                    switch(packet.Type) {
                        case "PumpIdleStatus":                                    
                            if (parseInt(packet.Data.NozzleUp, 10) > 0) {
                                pump.Status = "NOZZLE";
                                pump.Nozzle = packet.Data.NozzleUp;
                                pump.Price = parseFloat(Pump.GetGradeData(pump, pump.Nozzle).price).toFixed(SYSTEM_PRICE_DECIMAL_DIGITS);
                            } else {
                                pump.Status = "IDLE";
                                pump.Nozzle = "0";
                                pump.Price = packet.Data.LastPrice.toFixed(SYSTEM_PRICE_DECIMAL_DIGITS);
                            }

                            // Last transaction data
                            if (parseInt(packet.Data.LastNozzle, 10) > 0) {
                                pump.Transaction = packet.Data.LastTransaction;
                                pump.Volume = packet.Data.LastVolume.toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                                pump.Amount = packet.Data.LastAmount.toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                            } else {
                                pump.Volume = parseFloat("0").toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                                pump.Amount = parseFloat("0").toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                            }
                            
                            pump.Request = packet.Data.Request;
                            pump.User = packet.Data.User;
                            break;
                            
                        case "PumpFillingStatus":
                            pump.Status = "FILLING";
                            pump.Transaction = packet.Data.Transaction;
                            pump.Nozzle = packet.Data.Nozzle;
                            pump.Volume = packet.Data.Volume.toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                            pump.Amount = packet.Data.Amount.toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                            pump.Price = packet.Data.Price.toFixed(SYSTEM_PRICE_DECIMAL_DIGITS);
                            pump.User = packet.Data.User;
                            break;
                            
                        case "PumpEndOfTransactionStatus":
                            pump.Status = "FILLING";
                            pump.Transaction = packet.Data.Transaction;
                            pump.Nozzle = packet.Data.Nozzle;
                            pump.Volume = packet.Data.Volume.toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                            pump.Amount = packet.Data.Amount.toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                            pump.Price = packet.Data.Price.toFixed(SYSTEM_PRICE_DECIMAL_DIGITS);
                            pump.User = packet.Data.User;

                            // Close transaction
                            if (pump.User == $('.usernameSpanLg').text()/* ||
                                pump.User == SYSTEM_USER_PTS_NAME*/)
                                Pump.CloseTransaction(pump);
                            break;
                            
                        case "PumpOfflineStatus":
                            pump.Status = "OFFLINE";
                            pump.Nozzle = "0";                                        
                            pump.Transaction = "0";
                            pump.Volume = parseFloat("0").toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                            pump.Amount = parseFloat("0").toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                            pump.Price = parseFloat("0").toFixed(SYSTEM_PRICE_DECIMAL_DIGITS);
                            pump.Request = "";
                            pump.User = packet.Data.User;
                            break;
                            
                        case "PumpTotals":
                            pump.Transaction = packet.Data.Transaction;
                            pump.VolumeTotal = packet.Data.Volume.toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                            pump.AmountTotal = packet.Data.Amount.toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                            pump.User = packet.Data.User;
                            break;
                            
                        case "PumpPrices":
                            Pump.SetGradePrice(pump, 1, packet.Data.Prices[0]);
                            Pump.SetGradePrice(pump, 2, packet.Data.Prices[1]);
                            Pump.SetGradePrice(pump, 3, packet.Data.Prices[2]);
                            Pump.SetGradePrice(pump, 4, packet.Data.Prices[3]);
                            Pump.SetGradePrice(pump, 5, packet.Data.Prices[4]);
                            Pump.SetGradePrice(pump, 6, packet.Data.Prices[5]);
                            pump.User = packet.Data.User;
                            break;
                            
                        case "PumpTag":
                            pump.Tag = packet.Data.Tag;
                            pump.User = packet.Data.User;
                            break;
                    }

                    Pump.UpdateWidget(pump);
                    refreshControl(pump);
                }
            }
        });
    }).fail(function(response) {
        clearTimeout(timerPumpsPollingId);
        timerPumpsPollingId = setTimeout(pollPumps, 1000);

        failureResponsesCounter++;
        if (failureResponsesCounter > MAX_FAILURE_RESPONSES) {
            if (pumps.length > 0) {
                pumps.forEach(function(pump) {
                    pump.Status = "NO CONNECTION";
                    pump.Nozzle = "0";                                        
                    pump.Transaction = "0";
                    pump.Volume = parseFloat("0").toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS);
                    pump.Amount = parseFloat("0").toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS);
                    pump.Price = parseFloat("0").toFixed(SYSTEM_PRICE_DECIMAL_DIGITS);
                    pump.Request = "";
                    pump.User = "";

                    Pump.UpdateWidget(pump);
                    refreshControl(pump);
                });
            }
        }
    });
}

//-------------------------------------------------------------------------------------
// Set active/disabled controls
function refreshControl(pump) {
    switch (pump.Status) {
        case "IDLE":
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").attr("disabled", false);
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStartButton").attr("disabled", false);
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStopButton").attr("disabled", false);
            break;

        case "OFFLINE":
        case "NO CONNECTION":
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").attr("disabled", true);
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStartButton").attr("disabled", true);
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStopButton").attr("disabled", true);
            break;

        case "FILLING":
        case "NOZZLE":
            setPumpNozzleGrade(pump);
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").attr("disabled", true);
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStopButton").attr("disabled", false);

            if (pump.Status == "FILLING") {
                $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStartButton").attr("disabled", true);
            } else {
                $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStartButton").attr("disabled", false);
            }

            if (pump.Status == "FILLING" &&
                pump.User == $(".usernameSpanLg").text()) {
                if (pump.OrderAmount > 0) {
                    $("#pcpPump" + pump.Id.toString()).find(".pcpPumpProgress").attr("style", "width:" + parseInt(parseFloat(pump.Amount * 100 / pump.OrderAmount)) + "%");
                    $("#pcpPump" + pump.Id.toString()).find(".pcpPumpProgress").attr("aria-valuenow", parseInt(parseFloat(pump.Amount * 100 / pump.OrderAmount)));
                } else if (pump.OrderVolume > 0) {
                    $("#pcpPump" + pump.Id.toString()).find(".pcpPumpProgress").attr("style", "width:" + parseInt(parseFloat(pump.Volume * 100 / pump.OrderVolume)) + "%");
                    $("#pcpPump" + pump.Id.toString()).find(".pcpPumpProgress").attr("aria-valuenow", parseInt(parseFloat(pump.Volume * 100 / pump.OrderVolume)));
                }
            }
            break;
    }

    if ($('#pcpAuthorizeModal').hasClass("show") &&
        $(".pcpAuthDlgPumpNumber").text() == pump.Id.toString()) {
        
        // Set disabled or enabled
        var attr = $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").attr("disabled");
        if (typeof attr !== typeof undefined && attr !== false) {
            $("#pcpAuthDlgPumpNozzleGrade").attr("disabled", true);
        }
        else {
            $("#pcpAuthDlgPumpNozzleGrade").attr("disabled", false);
        }
        
        var widgetOptions = $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").html();
        var modalOptions = $("#pcpAuthDlgPumpNozzleGrade").html();
        if (widgetOptions != modalOptions ||
            (typeof attr !== typeof undefined && attr !== false)) {
            // Clear all options
            $("#pcpAuthDlgPumpNozzleGrade option").remove();

            // Copy options from widget
            $("#pcpAuthDlgPumpNozzleGrade").html(widgetOptions);

            // Set the option, which was selected on widget
            $("#pcpAuthDlgPumpNozzleGrade").val($("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade option:selected").val());
        }
    }
}

//-------------------------------------------------------------------------------------
function removePumpNozzleGrades(pump) {
    $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade option").remove();
}

//-------------------------------------------------------------------------------------
function addPumpNozzleGrade(pump, nozzleNumber, gradeName, gradePrice) {
    $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").append("<option value='" + nozzleNumber.toString() + "'>" + gradeName + " (" + gradePrice.toFixed(SYSTEM_PRICE_DECIMAL_DIGITS) + ")</option>");
    $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStartButton").attr("disabled", false);
}

//-------------------------------------------------------------------------------------
function checkPumpNozzleGrades(pump) {
    if ($("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade option").length == 0) {
        $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").append("<option value='1'>1</option>");
        $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").append("<option value='2'>2</option>");
        $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").append("<option value='3'>3</option>");
        $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").append("<option value='4'>4</option>");
        $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").append("<option value='5'>5</option>");
        $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").append("<option value='6'>6</option>");

        $("#pcpPump" + pump.Id.toString()).find(".pcpPumpStartButton").attr("disabled", true);
    }
}

//-------------------------------------------------------------------------------------
function setPumpNozzleGrade(pump) {
    if ($("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").has("option[value='" + pump.Nozzle.toString() + "']").length > 0) {
        $("#pcpPump" + pump.Id.toString()).find(".pcpPumpNozzleGrade").val(pump.Nozzle.toString());
        
        var gradeData = Pump.GetGradeData(pump, pump.Nozzle);
        if (gradeData != undefined &&
            gradeData.name != "" &&
            gradeData.price != 0) {
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpPrice").val(gradeData.price.toFixed(SYSTEM_PRICE_DECIMAL_DIGITS));
        } else {
            $("#pcpPump" + pump.Id.toString()).find(".pcpPumpPrice").val(parseFloat("0").toFixed(SYSTEM_PRICE_DECIMAL_DIGITS));
        }
    }    
}

//-------------------------------------------------------------------------------------
function stopPump(control) {
    var pump = pumps.filter(x => parseInt(x.Id, 10) == parseInt($(control).parents(".card").find(".pcpPumpNumber").text(), 10))[0];
    
    if (pump.Id == undefined) {
        showMessage(localizeString("NO_PUMP_SELECTED"));
        return;
    }

    // Authorize
    commands = [];
    commands.push({
        function: PumpStop,
        arguments: [
            pump.Id
        ]
    });
    request = createComplexRequest(commands, false);

    // Process response
    CheckResponse(request);
}

//-------------------------------------------------------------------------------------
$('#pcpAuthDlgPumpPresetValue').keypress(function (event) {
    event.preventDefault();
});

//-------------------------------------------------------------------------------------
var keyupListener = function(event) {
    var btn = event.code;
    var maximumDigits = ($("#pcpAuthDlgPumpMode").val() == localizeString("VOLUME")) ? SYSTEM_VOLUME_DECIMAL_DIGITS : SYSTEM_AMOUNT_DECIMAL_DIGITS;
    var text = "";

    if (btn != "Digit0" && 
        btn != "Numpad0" &&
        btn != "Digit1" && 
        btn != "Numpad1" && 
        btn != "Digit2" && 
        btn != "Numpad2" && 
        btn != "Digit3" && 
        btn != "Numpad3" && 
        btn != "Digit4" && 
        btn != "Numpad4" && 
        btn != "Digit5" && 
        btn != "Numpad5" && 
        btn != "Digit6" && 
        btn != "Numpad6" && 
        btn != "Digit7" && 
        btn != "Numpad7" && 
        btn != "Digit8" && 
        btn != "Numpad8" && 
        btn != "Digit9" && 
        btn != "Numpad9" && 
        btn != "Period" && 
        btn != "NumpadDecimal" && 
        btn != "Backspace" && 
        btn != "Enter" && 
        btn != "NumpadEnter") { 
        return false; 
    }

    if (btn == "Period" || btn == "NumpadDecimal")
        $('.pcpAuthDlgBtnDecimal').click();
    else if (btn == "Backspace")
        $('.pcpAuthDlgBtnClean').click();
    else if (btn == "Enter" || btn == "NumpadEnter")
        $('#pcpAuthDlgStartButton').click();
    else if (btn == "Digit0" || btn == "Numpad0")
        text = "0";
    else if (btn == "Digit1" || btn == "Numpad1")
        text = "1";
    else if (btn == "Digit2" || btn == "Numpad2")
        text = "2";
    else if (btn == "Digit3" || btn == "Numpad3")
        text = "3";
    else if (btn == "Digit4" || btn == "Numpad4")
        text = "4";
    else if (btn == "Digit5" || btn == "Numpad5")
        text = "5";
    else if (btn == "Digit6" || btn == "Numpad6")
        text = "6";
    else if (btn == "Digit7" || btn == "Numpad7")
        text = "7";
    else if (btn == "Digit8" || btn == "Numpad8")
        text = "8";
    else if (btn == "Digit9" || btn == "Numpad9")
        text = "9";
        
    if (text != "")
        fillInputFieldWithDecimalDigits($("#pcpAuthDlgPumpPresetValue"), text, maximumDigits, $("#pcpAuthDlgPumpPresetValue").val().length);
};

//-------------------------------------------------------------------------------------
$('#pcpAuthDlgPumpMode').on('change', function () {
    if (this.value == "FullTank") {
        $(".pcpAuthDlgPresetButton").attr('disabled', true);
        $(".pcpAuthDlgPumpPresetValueLabel").removeClass("text-dark").addClass("text-secondary");
        $("#pcpAuthDlgPumpPresetValue").val("");
        $("#pcpAuthDlgPumpPresetValue").attr('readonly', true);
        $("#pcpAuthDlgPumpPresetValue").removeClass("text-dark").addClass("text-secondary");
    } else {
        $(".pcpAuthDlgPresetButton").attr('disabled', false);
        $(".pcpAuthDlgPumpPresetValueLabel").removeClass("text-secondary").addClass("text-dark");
        $("#pcpAuthDlgPumpPresetValue").attr('readonly', false);
        $("#pcpAuthDlgPumpPresetValue").removeClass("text-secondary").addClass("text-dark");
    }
});

//-------------------------------------------------------------------------------------
$('#pcpAuthorizeModal').on('show.bs.modal', function (event) {
    // Pump widget
    var pumpWidget = $(event.relatedTarget).parents(".card");
    var pump = pumps.filter(x => parseInt(x.Id, 10) == parseInt(pumpWidget.find(".pcpPumpNumber").text(), 10))[0];

    $(".pcpAuthDlgPresetButton").attr('disabled', false);
    $(".pcpAuthDlgPumpPresetValueLabel").removeClass("text-secondary").addClass("text-dark");
    $("#pcpAuthDlgPumpPresetValue").removeClass("text-secondary").addClass("text-dark");

    $("#pcpAuthDlgPumpPresetValue").focus();

    // Check and set pump number
    $(".pcpAuthDlgPumpNumber").text(pump.Id);

    // Check and set pump nozzle or fuel grade
    var nozzleNumber = pumpWidget.find('.pcpPumpNozzleGrade option:selected').val();
    var gradeData = Pump.GetGradeData(pump, nozzleNumber);
    if (gradeData != undefined &&
        gradeData.name != "" &&
        gradeData.price != 0) {

        // Clear all options
        $("#pcpAuthDlgPumpNozzleGrade option").remove();

        // Copy options from widget
        var options = pumpWidget.find(".pcpPumpNozzleGrade").html();
        $("#pcpAuthDlgPumpNozzleGrade").html(options);

        // Set the option, which was selected on widget
        $("#pcpAuthDlgPumpNozzleGrade").val(pumpWidget.find(".pcpPumpNozzleGrade option:selected").val());
        
        // Set disabled or enabled
        var attr = pumpWidget.find(".pcpPumpNozzleGrade").attr("disabled");
        if (typeof attr !== typeof undefined && attr !== false) {
            $("#pcpAuthDlgPumpNozzleGrade").attr("disabled", true);
        }
        else {
            $("#pcpAuthDlgPumpNozzleGrade").attr("disabled", false);
        }
    }

    $("#pcpAuthDlgPumpMode").val("Volume");
    $("#pcpAuthDlgPumpPresetValue").val("");  

    // Set preset type
    if (getCookie(PUMP_PRESET_TYPE_COOKIE + pump.Id.toString()) != "") {
        $("#pcpAuthDlgPumpMode").val(getCookie(PUMP_PRESET_TYPE_COOKIE + pump.Id.toString())).trigger('change');
    } else {
        $("#pcpAuthDlgPumpMode").val($('#pcpAuthDlgPumpMode').val()).trigger('change');
    }  

    document.addEventListener('keyup', keyupListener);
});

//-------------------------------------------------------------------------------------
$('#pcpAuthorizeModal').on('hide.bs.modal', function (event) {
    document.removeEventListener('keyup', keyupListener);
});

//-------------------------------------------------------------------------------------
$('.pcpAuthDlgPresetButton').on('click', function (event) {
    var maximumDigits = ($("#pcpAuthDlgPumpMode").val() == localizeString("VOLUME")) ? SYSTEM_VOLUME_DECIMAL_DIGITS : SYSTEM_AMOUNT_DECIMAL_DIGITS;

    if (isNaN($(this).text()) == false &&
        $(this).text().trim() != "") {
            fillInputFieldWithDecimalDigits($("#pcpAuthDlgPumpPresetValue"), $(this).text(), maximumDigits, $("#pcpAuthDlgPumpPresetValue").val().length);
        //if (limitDecimalDigits($("#pcpAuthDlgPumpPresetValue"), $(this).text(), maximumDigits) == true) {
         //   $("#pcpAuthDlgPumpPresetValue").val($("#pcpAuthDlgPumpPresetValue").val() + $(this).text());
        //}
    } else if ($(this).text() == ".") {
        fillInputFieldWithDecimalDigits($("#pcpAuthDlgPumpPresetValue"), $(this).text(), maximumDigits, $("#pcpAuthDlgPumpPresetValue").val().length);
        //if (limitDecimalDigits($("#pcpAuthDlgPumpPresetValue"), $(this).text(), maximumDigits) == true) {
         //   $("#pcpAuthDlgPumpPresetValue").val($("#pcpAuthDlgPumpPresetValue").val() + $(this).text());
        //}
    } else {
        //$("#pcpAuthDlgPumpPresetValue").val($("#pcpAuthDlgPumpPresetValue").val().slice(0, -1));
        $("#pcpAuthDlgPumpPresetValue").val("");
        $("#pcpAuthDlgPumpPresetValue").focus();
    }
});

//-------------------------------------------------------------------------------------
$('#pcpAuthDlgStartButton').on('click', function () {
    var pumpNumber = parseInt($(".pcpAuthDlgPumpNumber").text(), 10);
    var nozzleNumber = parseInt($("#pcpAuthDlgPumpNozzleGrade option:selected").val(), 10);
    var pump = pumps.filter(x => parseInt(x.Id, 10) == parseInt(pumpNumber, 10))[0];
    var presetType = $("#pcpAuthDlgPumpMode").val();
    var presetDose = $("#pcpAuthDlgPumpPresetValue").val();

    if (nozzleNumber == undefined ||
        isNaN(nozzleNumber) == true) {
        showMessage(localizeString("NO_NOZZLE_SELECTED"));
        return;    
    }

    var price = Pump.GetGradeData(pump, nozzleNumber).price;
    
    if (pumpNumber == undefined ||
        isNaN(pumpNumber) == true) {
        showMessage(localizeString("NO_PUMP_SELECTED"));
        return;
    }

    // Validate pump status
    if (pump.Status != "IDLE" && pump.Status != "NOZZLE") {
        showMessage(localizeString("PUMP_IS_BUSY"));
        return;
    }

    // Validate price
    if (parseFloat(price) == NaN ||
        parseFloat(price) == 0) {
        showMessage(localizeString("PRICE_IS_NOT_VALID"));
        return;
    }

    // Get preset type
    if (presetType == "Volume" ||
        presetType == "Amount") {

        // Validate dose value
        if (presetDose == "" ||
            parseFloat(presetDose) == NaN) {
            showMessage(localizeString("PRESET_DOSE_IS_NOT_VALID"));
            return;
        }

        if (presetType == "Volume") {
            pump.OrderVolume = presetDose;
        } else {
            pump.OrderAmount = presetDose;
        }
    }

    // Set widget to save selected preset type for pump
    setCookie(PUMP_PRESET_TYPE_COOKIE + pumpNumber.toString(), presetType);

    $('#pcpAuthorizeModal').modal('hide');

    // Authorize
    commands = [];
    commands.push({
        function: PumpAuthorize,
        arguments: [
            pumpNumber, 
            nozzleNumber, 
            presetType, 
            presetDose, 
            price
        ]
    });
    request = createComplexRequest(commands, false);

    // Process response
    CheckResponse(request);
});

//-------------------------------------------------------------------------------------