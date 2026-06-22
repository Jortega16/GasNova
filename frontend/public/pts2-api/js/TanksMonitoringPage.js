var PRODUCT_HEIGHT = localizeString("PRODUCT_HEIGHT");
var PRODUCT_VOLUME = localizeString("PRODUCT_VOLUME");
var PRODUCT_TC_VOLUME = localizeString("PRODUCT_TC_VOLUME");
var PRODUCT_ULLAGE = localizeString("PRODUCT_ULLAGE");
var TEMPERATURE = localizeString("TEMPERATURE");
var WATER_HEIGHT = localizeString("WATER_HEIGHT");
var WATER_VOLUME = localizeString("WATER_VOLUME");
var PRODUCT_DENSITY = localizeString("PRODUCT_DENSITY");
var PRODUCT_MASS = localizeString("PRODUCT_MASS");

var HEIGHT_UNITS = localizeString("MM");
var DENSITY_UNITS = localizeString("KG/M3");
var MASS_UNITS = localizeString("KG");

var configurationId = 0;

// Existing tanks configuration
var tanks = [];
var fuelGrades = [];

var tank;

var automaticDeliveryString;

// Localization
$(".tmpTanksMonitoringLabel").text(localizeString("TAB_TANKS_MONITORING"));
$(".tmpNoTanksConfiguredLabel").text(localizeString("NO_TANKS_CONFIGURED"));

// Get tanks configuration and states on page start
initConfiguration();

//-------------------------------------------------------------------------------------
function initConfiguration() {

    clearTimeout(timerProbesPollingId);

    // Hide controls
    $("#tmpNoTanks").addClass("d-none");
    $("#tmpTanks").addClass("d-none");
    $("#tmpTanks").empty();

    // Clean arrays
    commands = [];

    // Get firmware information to get list of protocols supported and get tanks configuration
    commands.push({
        function: GetProbesConfiguration
    },{
        function: GetTanksConfiguration
    },{
        function: GetFuelGradesConfiguration
    },{
        function: GetConfigurationIdentifier
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
                            Code: fuelGradeDataItem.Code,
                            Name: fuelGradeDataItem.Name,
                            Price: fuelGradeDataItem.Price
                        });
                    });
                }
            }
        }
        
        // Probes configuration
        data = response.Packets.filter(Packet => Packet.Type == "ProbesConfiguration");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data == undefined) {
                return;
            } else {

                // Set probes configuration
                if (data.Probes.length > 0) {
                    tanks = [];
                    data.Probes.forEach(function(probeData) {
                        if (parseInt(probeData.Port, 10) != 0 && parseInt(probeData.Address, 10) != 0) {

                            // Add tanks objects
                            tanks.push(new Tank(parseInt(probeData.Id, 10)));
                        }
                    });
                } else {
                    // Hide tanks
                    $("#tmpNoTanks").removeClass("d-none");
                    return;
                }

                if (tanks.length > 0) {
                    // Tanks configuration
                    data = response.Packets.filter(Packet => Packet.Type == "TanksConfiguration");
                    if (data != null &&
                        data != undefined &&
                        data.length > 0) {
                        data = data[0].Data;
                        if (data == undefined) {
                            return;
                        } else {

                            // Show tanks
                            $("#tmpTanks").removeClass("d-none");
                            $("#tmpNoTanks").addClass("d-none");

                            // Fill in response values
                            if (data.Tanks.length > 0) {

                                data.Tanks.forEach(function(tankDataItem) {

                                    if (parseInt(tankDataItem.Id, 10) > 0) {
                                        tank = tanks.filter(tank => tank.Id == parseInt(tankDataItem.Id, 10))[0];
                                        if (tank != null) {

                                            // Set tank height
                                            tank.Height = tankDataItem.Height;

                                            // Set tank grade code and name
                                            fuelGrades.forEach(function(fuelGradeDataItem) {
                                                if (tankDataItem.FuelGradeId != undefined && 
                                                    tankDataItem.FuelGradeId != "0" &&
                                                    parseInt(fuelGradeDataItem.Id, 10) == parseInt(tankDataItem.FuelGradeId, 10)) {
                                                    tank.GradeCode = fuelGradeDataItem.Id;
                                                    tank.GradeName = fuelGradeDataItem.Name;
                                                    return;
                                                }
                                            });
                                        }
                                    }
                                });
                            }

                            // Draw tank
                            tanks.forEach(function(tank) {
                                Tank.Draw(tank);

                                // Display grade name
                                if (tank.GradeName != undefined &&
                                    tank.GradeName != "") {
                                    $("#tmpTank" + tank._id.toString() + " .tmpFuelGradeName").removeClass("d-none");
                                }
                            });
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

        // Start polling probes
        if (tanks.length > 0) {
            configurationReceived = 1;
            pollProbes();
        }
    });
}

//-------------------------------------------------------------------------------------
// Poll probes
function pollProbes() {
    
    var data;
    var automaticDeliveryString = "";
    var alarmString = "";
    
    // Clean arrays
    commands = [];

    // Stop operation on any other page
    if (window.location.href.indexOf("TanksMonitoringPage") == -1) {
        clearTimeout(timerProbesPollingId);
        return;
    }

    if (tanks.length > 0) {
        tanks.forEach(function(tankData) {
            commands.push({
                function: ProbeGetMeasurements,
                arguments: [
                    tankData.Id
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
        request.done(function(response) {
            failureResponsesCounter = 0;

            if (responseNull == true)
                return;

            // Loop through all response packets
            response.Packets.forEach(function(packet) {

                if (packet.Type == "ConfigurationIdentifier") {
                    // Configuration identifier
                    data = packet.Data;
                    if (data == undefined) {
                        return;
                    } else {
                        // Fill in response values
                        if (data.Id != undefined &&
                            configurationId != data.Id) {
    
                            // Get all configurations
                            initConfiguration();
                        } else {
                            clearTimeout(timerProbesPollingId);
                            timerProbesPollingId = setTimeout(pollProbes, 1000);
                        }
                    }
                } else {
                    // Get current tank from response
                    var tank = tanks.filter(x => parseInt(x.Id, 10) == parseInt(packet.Data.Probe, 10))[0];

                    if (tank != null) {
                        if (packet.Data.Status != null) {
                            tank.Status = packet.Data.Status;

                            if (packet.Data.ProductHeight != null) {
                                tank.ProductHeight = packet.Data.ProductHeight;
                            } else {
                                tank.ProductHeight = "-";
                            }

                            if (packet.Data.WaterHeight != null) {
                                tank.WaterHeight = packet.Data.WaterHeight;
                            } else {
                                tank.WaterHeight = "-";
                            }

                            if (packet.Data.Temperature != null) {
                                tank.Temperature = packet.Data.Temperature;
                            } else {
                                tank.Temperature = "-";
                            }

                            if (packet.Data.ProductVolume != null) {
                                tank.ProductVolume = packet.Data.ProductVolume;
                            } else {
                                tank.ProductVolume = "-";
                            }

                            if (packet.Data.WaterVolume != null) {
                                tank.WaterVolume = packet.Data.WaterVolume;
                            } else {
                                tank.WaterVolume = "-";
                            }

                            if (packet.Data.ProductUllage != null) {
                                tank.ProductUllage = packet.Data.ProductUllage;
                            } else {
                                tank.ProductUllage = "-";
                            }

                            if (packet.Data.ProductTCVolume != null) {
                                tank.ProductTCVolume = packet.Data.ProductTCVolume;
                            } else {
                                tank.ProductTCVolume = "-";
                            }

                            if (packet.Data.ProductDensity != null) {
                                tank.ProductDensity = packet.Data.ProductDensity;
                            } else {
                                tank.ProductDensity = "-";
                            }

                            if (packet.Data.ProductMass != null) {
                                tank.ProductMass = packet.Data.ProductMass;
                            } else {
                                tank.ProductMass = "-";
                            }
                        }

                        // Alarms
                        if ((packet.Data.Alarms != undefined && (packet.Data.Alarms.includes("CriticalHighProduct") || 
                                                                 packet.Data.Alarms.includes("HighProduct") || 
                                                                 packet.Data.Alarms.includes("LowProduct") || 
                                                                 packet.Data.Alarms.includes("CriticalLowProduct") || 
                                                                 packet.Data.Alarms.includes("HighWater"))) ||
                            tank.Status.toLowerCase() == "error") {                                
                                alarmString = "";

                                if (tank.Status.toLowerCase() == "error") {
                                    alarmString += "<li>" + localizeString("TANK_ALARM_REGISTERED") + "</li>";
                                }

                                if (packet.Data.Alarms != undefined && packet.Data.Alarms.includes("CriticalHighProduct")) {
                                    tank.CriticalHighProductAlarmPresent = true;
                                    alarmString += "<li>" + localizeString("CRITICAL_HIGH_PRODUCT_ALARM_REGISTERED") + "</li>";
                                } 
                                
                                if (packet.Data.Alarms != undefined && packet.Data.Alarms.includes("HighProduct")) {
                                    tank.HighProductAlarmPresent = true;
                                    alarmString += "<li>" + localizeString("HIGH_PRODUCT_ALARM_REGISTERED") + "</li>";
                                } 
                                
                                if (packet.Data.Alarms != undefined && packet.Data.Alarms.includes("LowProduct")) {
                                    tank.LowProductAlarmPresent = true;
                                    alarmString += "<li>" + localizeString("LOW_PRODUCT_ALARM_REGISTERED") + "</li>";
                                } 
                                
                                if (packet.Data.Alarms != undefined && packet.Data.Alarms.includes("CriticalLowProduct")) {
                                    tank.CriticalLowProductAlarmPresent = true;
                                    alarmString += "<li>" + localizeString("CRITICAL_LOW_PRODUCT_ALARM_REGISTERED") + "</li>";
                                } 
                                
                                if (packet.Data.Alarms != undefined && packet.Data.Alarms.includes("HighWater")) {
                                    tank.HighWaterAlarmPresent = true;
                                    alarmString += "<li>" + localizeString("HIGH_WATER_ALARM_REGISTERED") + "</li>";
                                }

                                $("#tmpTank" + tank._id.toString() + " .tmpWarningButton").removeClass("d-none");
                                $("#tmpTank" + tank._id.toString() + " .tmpWarningInfo").html("<div class='font-weight-bold bg-danger text-white p-2 w-100'>" + localizeString("ALARM") + "!</div><hr class='m-0 p-0'><div class='font-weight-bold p-2 w-100'><ol>" + alarmString + "</ol></div>");
                        } else {
                            tank.CriticalHighProductAlarmPresent = false;
                            tank.HighProductAlarmPresent = false;
                            tank.LowProductAlarmPresent = false;
                            tank.CriticalLowProductAlarmPresent = false;
                            tank.HighWaterAlarmPresent = false;

                            $("#tmpTank" + tank._id.toString() + " .tmpWarningButton").addClass("d-none");
                            $("#tmpTank" + tank._id.toString() + " .tmpWarningInfo").empty();
                        }

                        // Automatic in-tank deliveries
                        if (packet.Data.LastInTankDeliveryStart != undefined &&
                            packet.Data.LastInTankDeliveryEnd != undefined &&
                            ((packet.Data.LastInTankDeliveryStart.ProductHeight != undefined && packet.Data.LastInTankDeliveryEnd.ProductHeight != undefined && parseInt(packet.Data.LastInTankDeliveryEnd.ProductHeight, 10) > parseInt(packet.Data.LastInTankDeliveryStart.ProductHeight, 10)) ||
                            (packet.Data.LastInTankDelivery != undefined && packet.Data.LastInTankDelivery.ProductVolume != undefined && packet.Data.LastInTankDelivery.ProductVolume > 0))) {
                            
                            // Start of delivery values
                            automaticDeliveryString = "<b>" + localizeString("MEASUREMENTS_ON_START") + ":</b><br/>";

                            if (packet.Data.LastInTankDeliveryStart.DateTime != undefined)
                                automaticDeliveryString += " - " + localizeString("DATE_TIME") + ": " + packet.Data.LastInTankDeliveryStart.DateTime.replace(/-/g, ".").replace(/T/g, " ") + "<br/>";
                                
                            if (packet.Data.LastInTankDeliveryStart.ProductHeight != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_HEIGHT") + ": " + packet.Data.LastInTankDeliveryStart.ProductHeight + " " + HEIGHT_UNITS + "<br/>";

                            if (packet.Data.LastInTankDeliveryStart.WaterHeight != undefined)
                                automaticDeliveryString += " - " + localizeString("WATER_HEIGHT") + ": " + packet.Data.LastInTankDeliveryStart.WaterHeight + " " + HEIGHT_UNITS + "<br/>";

                            if (packet.Data.LastInTankDeliveryStart.Temperature != undefined)
                                automaticDeliveryString += " - " + localizeString("TEMPERATURE") + ": " + packet.Data.LastInTankDeliveryStart.Temperature + " " + getTemperatureUnit() + "<br/>";

                            if (packet.Data.LastInTankDeliveryStart.ProductVolume != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_VOLUME") + ": " + packet.Data.LastInTankDeliveryStart.ProductVolume + " " + getVolumeUnit() + "<br/>";

                            if (packet.Data.LastInTankDeliveryStart.ProductTCVolume != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_TC_VOLUME") + ": " + packet.Data.LastInTankDeliveryStart.ProductTCVolume + " " + getVolumeUnit() + "<br/>";

                            if (packet.Data.LastInTankDeliveryStart.ProductDensity != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_DENSITY") + ": " + packet.Data.LastInTankDeliveryStart.ProductDensity + " " + DENSITY_UNITS + "<br/>";

                            if (packet.Data.LastInTankDeliveryStart.ProductMass != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_MASS") + ": " + packet.Data.LastInTankDeliveryStart.ProductMass + " " + MASS_UNITS + "<br/>";
                            
                            // End of delivery values
                            automaticDeliveryString += "<br/><b>" + localizeString("MEASUREMENTS_ON_END") + ":</b></br>";

                            if (packet.Data.LastInTankDeliveryEnd.DateTime != undefined)
                                automaticDeliveryString += " - " + localizeString("DATE_TIME") + ": " + packet.Data.LastInTankDeliveryEnd.DateTime.replace(/-/g, ".").replace(/T/g, " ") + "<br/>";
                            
                            if (packet.Data.LastInTankDeliveryEnd.ProductHeight != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_HEIGHT") + ": " + packet.Data.LastInTankDeliveryEnd.ProductHeight + " " + HEIGHT_UNITS + "<br/>";

                            if (packet.Data.LastInTankDeliveryEnd.WaterHeight != undefined)
                                automaticDeliveryString += " - " + localizeString("WATER_HEIGHT") + ": " + packet.Data.LastInTankDeliveryEnd.WaterHeight + " " + HEIGHT_UNITS + "<br/>";

                            if (packet.Data.LastInTankDeliveryEnd.Temperature != undefined)
                                automaticDeliveryString += " - " + localizeString("TEMPERATURE") + ": " + packet.Data.LastInTankDeliveryEnd.Temperature + " " + getTemperatureUnit() + "<br/>";

                            if (packet.Data.LastInTankDeliveryEnd.ProductVolume != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_VOLUME") + ": " + packet.Data.LastInTankDeliveryEnd.ProductVolume + " " + getVolumeUnit() + "<br/>";

                            if (packet.Data.LastInTankDeliveryEnd.ProductTCVolume != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_TC_VOLUME") + ": " + packet.Data.LastInTankDeliveryEnd.ProductTCVolume + " " + getVolumeUnit() + "<br/>";

                            if (packet.Data.LastInTankDeliveryEnd.ProductDensity != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_DENSITY") + ": " + packet.Data.LastInTankDeliveryEnd.ProductDensity + " " + DENSITY_UNITS + "<br/>";

                            if (packet.Data.LastInTankDeliveryEnd.ProductMass != undefined)
                                automaticDeliveryString += " - " + localizeString("PRODUCT_MASS") + ": " + packet.Data.LastInTankDeliveryEnd.ProductMass + " " + MASS_UNITS + "<br/>";
                            
                            // Delivery absolute values
                            if (packet.Data.LastInTankDelivery != undefined)
                            {
                                automaticDeliveryString += "<br/><b>" + localizeString("DELIVERY_ABSOLUTE_VALUES") + ":</b><br/>";

                                if (packet.Data.LastInTankDelivery.ProductHeight != undefined)
                                    automaticDeliveryString += " - " + localizeString("PRODUCT_HEIGHT") + ": " + packet.Data.LastInTankDelivery.ProductHeight + " " + HEIGHT_UNITS + "<br/>";

                                if (packet.Data.LastInTankDelivery.WaterHeight != undefined)
                                    automaticDeliveryString += " - " + localizeString("WATER_HEIGHT") + ": " + packet.Data.LastInTankDelivery.WaterHeight + " " + HEIGHT_UNITS + "<br/>";

                                if (packet.Data.LastInTankDelivery.Temperature != undefined)
                                    automaticDeliveryString += " - " + localizeString("TEMPERATURE") + ": " + packet.Data.LastInTankDelivery.Temperature  + " " + getTemperatureUnit() + "<br/>";

                                if (packet.Data.LastInTankDelivery.ProductVolume != undefined)
                                    automaticDeliveryString += " - " + localizeString("PRODUCT_VOLUME") + ": " + packet.Data.LastInTankDelivery.ProductVolume + " " + getVolumeUnit() + "<br/>";

                                if (packet.Data.LastInTankDelivery.ProductTCVolume != undefined)
                                    automaticDeliveryString += " - " + localizeString("PRODUCT_TC_VOLUME") + ": " + packet.Data.LastInTankDelivery.ProductTCVolume + " " + getVolumeUnit() + "<br/>";

                                if (packet.Data.LastInTankDelivery.ProductDensity != undefined)
                                    automaticDeliveryString += " - " + localizeString("PRODUCT_DENSITY") + ": " + packet.Data.LastInTankDelivery.ProductDensity + " " + DENSITY_UNITS + "<br/>";

                                if (packet.Data.LastInTankDelivery.ProductMass != undefined)
                                    automaticDeliveryString += " - " + localizeString("PRODUCT_MASS") + ": " + packet.Data.LastInTankDelivery.ProductMass + " " + MASS_UNITS + "<br/>";

                                if (packet.Data.LastInTankDelivery.PumpsDispensedVolume != undefined)
                                    automaticDeliveryString += " - " + localizeString("PUMPS_DISPENSED_VOLUME") + ": " + packet.Data.LastInTankDelivery.PumpsDispensedVolume + " " + getVolumeUnit() + "<br/>";
                            }

                            $("#tmpTank" + tank._id.toString() + " .tmpDeliveryButton").removeClass("d-none");
                            $("#tmpTank" + tank._id.toString() + " .tmpDeliveryInfo").html("<div class='font-weight-bold bg-info text-white p-2 w-100'>" + localizeString("LAST_IN_TANK_DELIVERY") + ":</div><hr class='m-0 p-0'><div class='font-weight-normal p-2 w-100'>" + automaticDeliveryString + "</div>");
                        } else {
                            $("#tmpTank" + tank._id.toString() + " .tmpDeliveryButton").addClass("d-none");
                            $("#tmpTank" + tank._id.toString() + " .tmpDeliveryInfo").empty();
                        }

                        // Refresh tanks
                        Tank.Update(tank);         
                    }
                }
            });
        }).fail(function(response) {
            clearTimeout(timerProbesPollingId);
            timerProbesPollingId = setTimeout(pollProbes, 1000);

            failureResponsesCounter++;
            if (failureResponsesCounter > MAX_FAILURE_RESPONSES) {            
                if (tanks.length > 0) {
                    tanks.forEach(function(tank) {
                        tank.Status = localizeString("NO_CON.");
                        tank.ProductHeight = "-";                                       
                        tank.WaterHeight = "-";
                        tank.Temperature = "-";
                        tank.ProductVolume = "-";
                        tank.WaterVolume = "-";
                        tank.ProductUllage = "-";
                        tank.ProductTCVolume = "-";
                        tank.ProductDensity = "-";
                        tank.ProductMass = "-";

                        // Refresh tanks
                        Tank.Update(tank);
                    });
                }
            }
        });
    }
}

//-------------------------------------------------------------------------------------