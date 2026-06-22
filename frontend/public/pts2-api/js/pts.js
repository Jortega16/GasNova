//-------------------------------------------------------------------------------------
//------------------------------------ Constants --------------------------------------
//-------------------------------------------------------------------------------------

var TOTAL_PUMP_PORTS = 4;
var TOTAL_PUMPS = 50;
var TOTAL_PROBE_PORTS = 3;
var TOTAL_PROBES = 50;
var TOTAL_PRICE_BOARDS = 5;
var TOTAL_READERS = TOTAL_PUMPS;

ParametersTypeEnum = {
    PARAMETERS_TYPE_NOT_SELECTED : "-1",
    PARAMETERS_TYPE_PTS1 : "0",
    PARAMETERS_TYPE_PTS2 : "1",
    PARAMETERS_TYPE_PUMP : "2",
    PARAMETERS_TYPE_PROBE : "3",
    PARAMETERS_TYPE_PUMP_COMMON : "4",
    PARAMETERS_TYPE_PROBE_COMMON : "5"
};

ParameterInputTypeEnum = {
    PARAMETER_INPUT_TYPE_BOOL : "0",
    PARAMETER_INPUT_TYPE_ENUM : "1",
    PARAMETER_INPUT_TYPE_INT : "2",
    PARAMETER_INPUT_TYPE_FLOAT : "3"
};

var TOTAL_FUEL_GRADES = 10;
var TOTAL_FUEL_GRADE_CODE = 255;
var TOTAL_FUEL_GRADE_NAME = 20;

var TOTAL_TANKS = TOTAL_PROBES;

var TOTAL_USERS = 10;
var TOTAL_USER_LOGIN_LENGTH = 10;
var TOTAL_USER_PASSWORD_LENGTH = 10;

var LANGUAGE = "EN";
var DATATABLES_LANGUAGE_FILE = "";

var VOLUME_UNITS = "L";
var TEMPERATURE_UNITS = "C";

var ptsConfig = null;

var responseNull = false;

var failureResponsesCounter = 0;
var MAX_FAILURE_RESPONSES = 3;

var TAG_ID_MAX_LENGTH = 16;
var TAG_NAME_MAX_LENGTH = 20;

var TASK_NAME_STRING = localizeString("TASK");
var TASK_PRIORITY_STRING = localizeString("PRIORITY");
var TASK_STATE_STRING = localizeString("STATE");
var TASK_STACK_HIGH_WATERMARK_STRING = localizeString("STACK_HIGH_WATERMARK");
var TASK_RUNTIME_COUNTER_STRING = localizeString("RUN_TIME_COUNTER_MS");

var TASK_CURRENT_HEAP_FREE_SIZE = localizeString("CURRENT_HEAP_FREE_SIZE");
var TASK_MINIMAL_HEAP_FREE_SIZE = localizeString("MINIMAL_HEAP_FREE_SIZE");
var TASK_TOTAL_RUN_TIME = localizeString("TOTAL_RUN_TIME_MS");
var TASK_SYSTEM_UP_TIME = localizeString("SYSTEM_UP_TIME");

var configurationPumpProtocolsList = [];
var configurationProbeProtocolsList = [];
var configurationPriceBoardProtocolsList = [];
var configurationReaderProtocolsList = [];

// Check for busy ports
var configurationData;
var dispPortIsBusy = 0;
var logPortIsBusy = 0;
var userPortIsBusy = 0;

// Request to PTS controller
var request = 0;
var commands = [];
var additionalCommands = [];
var counter = 0;
var data;

// Temporary data
var counter1 = 0;
var counter2 = 0;

var DEVICE_ID = "";

//-------------------------------------------------------------------------------------
//-------------------------------------- Timers ---------------------------------------
//-------------------------------------------------------------------------------------

var timerPumpsPollingId = 0;
var timerProbesPollingId = 0;
var timerLogging = 0;
var timerDiagnostics = 0;
var timerShowMessageId = 0;
var timerTagReaderPolling = 0;

//-------------------------------------------------------------------------------------
//--------------------- jsonPTS communication protocol requests -----------------------
//-------------------------------------------------------------------------------------

function createComplexRequest(commands, showLoader = true, timeoutValue = 30000) {
    
    // Form request
    var request = new Object();
    request.Protocol = "jsonPTS";
    request.Packets = new Array();
	
	timeoutValue = 30000;
    
    commands.forEach(function(command, counter) {
        var packet = new Object();
        packet.Id = counter + 1;
        packet.Type = command.function.name;
        var data = window[command.function.name].apply(this, command.arguments);
        packet.Data = (data === undefined ? {} : data);
        request.Packets.push(packet);
    });

    // Convert to json format
    return sendRequest(JSON.stringify(request), showLoader, timeoutValue);
}

//-------------------------------------------------------------------------------------
function GetConfigurationIdentifier() {
    var data = new Object();
    return data;
}

//-------------------------------------------------------------------------------------
function GetLanguage() {
    return;
}

//-------------------------------------------------------------------------------------
function GetMeasurementUnits() {
    return;
}

//-------------------------------------------------------------------------------------
function GetDateTime() {
    return;
}

//-------------------------------------------------------------------------------------
function SetDateTime(dateTime, autoSync, utcOffset) {
    var data = new Object();

    data.DateTime = dateTime;
    data.AutoSynchronize = autoSync;
    data.UTCOffset = utcOffset;

    return data;
}

//-------------------------------------------------------------------------------------
function GetUserInformation() {
    return;
}

//-------------------------------------------------------------------------------------
function GetFirmwareInformation() {
    return;
}

//-------------------------------------------------------------------------------------
function GetBatteryVoltage() {
    return;
}

//-------------------------------------------------------------------------------------
function GetCpuTemperature() {
    return;
}

//-------------------------------------------------------------------------------------
function GetUniqueIdentifier() {
    return;
}

//-------------------------------------------------------------------------------------
function GetSdInformation() {
    return;
}

//-------------------------------------------------------------------------------------
function GetGpsData() {
    return;
}

//-------------------------------------------------------------------------------------
function GetSystemOperationInformation() {
    return;
}

//-------------------------------------------------------------------------------------
function FileDelete(filename) {
    var data = new Object();

    data.Name = filename;

    return data;
}

//-------------------------------------------------------------------------------------
function Logout() {
    return;
}

//-------------------------------------------------------------------------------------
function Restart() {
    return;
}

//-------------------------------------------------------------------------------------
function BackupConfiguration(restoreConfigurationOnStartup = false) {
    var data = new Object();

    data.RestoreConfigurationOnStartup = restoreConfigurationOnStartup;

    return data;
}

//-------------------------------------------------------------------------------------
function RestoreConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function GetPtsNetworkSettings() {
    return;
}

//-------------------------------------------------------------------------------------
function SetPtsNetworkSettings(IpAddress1, IpAddress2, IpAddress3, IpAddress4, 
                            NetMask1, NetMask2, NetMask3, NetMask4, 
                            Gateway1, Gateway2, Gateway3, Gateway4, 
                            HttpPort, HttpsPort, 
                            Dns11, Dns12, Dns13, Dns14,
                            Dns21, Dns22, Dns23, Dns24) {
    var data = new Object();

    data.IpAddress = new Array();
    data.IpAddress.push(parseInt(IpAddress1, 10));
    data.IpAddress.push(parseInt(IpAddress2, 10));
    data.IpAddress.push(parseInt(IpAddress3, 10));
    data.IpAddress.push(parseInt(IpAddress4, 10));

    data.NetMask = new Array();
    data.NetMask.push(parseInt(NetMask1, 10));
    data.NetMask.push(parseInt(NetMask2, 10));
    data.NetMask.push(parseInt(NetMask3, 10));
    data.NetMask.push(parseInt(NetMask4, 10));

    data.Gateway = new Array();
    data.Gateway.push(parseInt(Gateway1, 10));
    data.Gateway.push(parseInt(Gateway2, 10));
    data.Gateway.push(parseInt(Gateway3, 10));
    data.Gateway.push(parseInt(Gateway4, 10));
    
    data.HttpPort = parseInt(HttpPort, 10);
    data.HttpsPort = parseInt(HttpsPort, 10);

    data.Dns1 = new Array();
    data.Dns1.push(parseInt(Dns11, 10));
    data.Dns1.push(parseInt(Dns12, 10));
    data.Dns1.push(parseInt(Dns13, 10));
    data.Dns1.push(parseInt(Dns14, 10));

    data.Dns2 = new Array();
    data.Dns2.push(parseInt(Dns21, 10));
    data.Dns2.push(parseInt(Dns22, 10));
    data.Dns2.push(parseInt(Dns23, 10));
    data.Dns2.push(parseInt(Dns24, 10));

    return data;
}

//-------------------------------------------------------------------------------------
function GetRemoteServerConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetRemoteServerConfiguration(IpAddress1, IpAddress2, IpAddress3, IpAddress4, 
                            DomainName, Uri, Port, UserId, UseDeviceIdentifierAsLogin, ServerResponseTimeoutSeconds, 
                            UploadPumpTransactions, UploadTankMeasurements, UploadGpsRecords, UseUploadTestRequests, UploadTestRequestsPeriodSeconds, 
                            SecretKey, UpdateSecretKey, UseWebsocketsCommunication, WebsocketsUri, WebsocketsPort, WebsocketsReconnectPeriod) {
    var data = new Object();

    data.IpAddress = new Array();
    data.IpAddress.push(parseInt(IpAddress1, 10));
    data.IpAddress.push(parseInt(IpAddress2, 10));
    data.IpAddress.push(parseInt(IpAddress3, 10));
    data.IpAddress.push(parseInt(IpAddress4, 10));

    data.DomainName = DomainName;
    data.Uri = Uri;
    data.Port = parseInt(Port, 10);
    data.UserId = UserId;
    data.UseDeviceIdentifierAsLogin = UseDeviceIdentifierAsLogin;
    data.ServerResponseTimeoutSeconds = parseInt(ServerResponseTimeoutSeconds);
    data.UploadPumpTransactions = UploadPumpTransactions;
    data.UploadTankMeasurements = UploadTankMeasurements;
    data.UploadGpsRecords = UploadGpsRecords;
    data.UseUploadTestRequests = UseUploadTestRequests;
    data.UploadTestRequestsPeriodSeconds = parseInt(UploadTestRequestsPeriodSeconds);
    data.SecretKey = SecretKey;
    data.UpdateSecretKey = UpdateSecretKey;
    data.UseWebsocketsCommunication = UseWebsocketsCommunication;
    data.WebsocketsUri = WebsocketsUri;
    data.WebsocketsPort = parseInt(WebsocketsPort, 10);
    data.WebsocketsReconnectPeriod = parseInt(WebsocketsReconnectPeriod);

    return data;
}

//-------------------------------------------------------------------------------------
function GetDailyProcessingTime() {
    return;
}

//-------------------------------------------------------------------------------------
function SetDailyProcessingTime(time) {
    var data = new Object();

    data.Time = time;

    return data;
}

//-------------------------------------------------------------------------------------
function GetPumpsConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetPumpsConfiguration(pumpPortsData, pumpsData) {
    var tmpCounter = 0;
    var data = new Object();

    data.Ports = new Array();
    
    // Fill in pump ports
    for (tmpCounter = 0; tmpCounter < pumpPortsData.length; tmpCounter++) {
        if (pumpPortsData[tmpCounter].communicationProtocol.split('.')[0] != "0" &&
            pumpPortsData[tmpCounter].baudRate.split('.')[0] != "0") {
            data.Ports.push({
                Id: parseInt(pumpPortsData[tmpCounter].pumpPort, 10),
                Protocol: parseInt(pumpPortsData[tmpCounter].communicationProtocol.split('.')[0], 10),
                BaudRate: parseInt(pumpPortsData[tmpCounter].baudRate.split('.')[0], 10)
            });
        }
    }
    
    data.Pumps = new Array();

    // Fill in pumps
    for (tmpCounter = 0; tmpCounter < pumpsData.length; tmpCounter++) {
        if (pumpsData[tmpCounter].pumpPort.split(' ')[0] != "0" &&
            pumpsData[tmpCounter].communicationAddress.split(' ')[0] != "0") {
            data.Pumps.push({
                Id: parseInt(pumpsData[tmpCounter].pump, 10),
                Port: parseInt(pumpsData[tmpCounter].pumpPort.split(' ')[0], 10),
                Address: parseInt(pumpsData[tmpCounter].communicationAddress.split(' ')[0], 10)
            });
        }
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetProbesConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetProbesConfiguration(probePortsData, probesData) {
    var tmpCounter = 0;    
    var data = new Object();

    data.Ports = new Array();
    
    // Fill in probe ports
    if (probePortsData[0].communicationProtocol.split('.')[0] != "0" &&
        probePortsData[0].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "DISP",
            Protocol: parseInt(probePortsData[0].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(probePortsData[0].baudRate.split('.')[0], 10)
        });
    }
    if (probePortsData[1].communicationProtocol.split('.')[0] != "0" &&
        probePortsData[1].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "LOG",
            Protocol: parseInt(probePortsData[1].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(probePortsData[1].baudRate.split('.')[0], 10)
        });
    }
    if (probePortsData[2].communicationProtocol.split('.')[0] != "0" &&
        probePortsData[2].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "USER",
            Protocol: parseInt(probePortsData[2].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(probePortsData[2].baudRate.split('.')[0], 10)
        });
    }
    
    data.Probes = new Array();

    // Fill in probes
    for (tmpCounter = 0; tmpCounter < probesData.length; tmpCounter++) {
        if (probesData[tmpCounter].probePort.split(' ')[0] != "0" &&
            probesData[tmpCounter].communicationAddress.split(' ')[0] != "0") {
            if (probesData[tmpCounter].probePort == "DISP") {
                data.Probes.push({
                    Id: parseInt(probesData[tmpCounter].probe, 10),
                    Port: "DISP",
                    Address: parseInt(probesData[tmpCounter].communicationAddress.split(' ')[0], 10)
                });
            } else if (probesData[tmpCounter].probePort == "LOG") {
                data.Probes.push({
                    Id: parseInt(probesData[tmpCounter].probe, 10),
                    Port: "LOG",
                    Address: parseInt(probesData[tmpCounter].communicationAddress.split(' ')[0], 10)
                });
            } else if (probesData[tmpCounter].probePort == "USER") {
                data.Probes.push({
                    Id: parseInt(probesData[tmpCounter].probe, 10),
                    Port: "USER",
                    Address: parseInt(probesData[tmpCounter].communicationAddress.split(' ')[0], 10)
                });
            } else {
                data.Probes.push({
                    Id: parseInt(probesData[tmpCounter].probe, 10),
                    Port: "0",
                    Address: parseInt(probesData[tmpCounter].communicationAddress.split(' ')[0], 10)
                });
            }
        }
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetFuelGradesConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetFuelGradesConfiguration(fuelGradesData) {
    var tmpCounter = 0;
    var data = new Object();

    data.FuelGrades = new Array();
    
    // Fill in fuel grades
    for (tmpCounter = 0; tmpCounter < fuelGradesData.length; tmpCounter++) {
        if (fuelGradesData[tmpCounter].name.length > 0 && fuelGradesData[tmpCounter].price != 0) {
            data.FuelGrades.push({
                Id: parseInt(fuelGradesData[tmpCounter].fuelGradeId, 10),
                Name: fuelGradesData[tmpCounter].name.toString(),
                Price: parseFloat(fuelGradesData[tmpCounter].price),
                ExpansionCoefficient: parseFloat(fuelGradesData[tmpCounter].expansionCoefficient)
            });
        }
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetPumpNozzlesConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetPumpNozzlesConfiguration(pumpNozzlesData) {
    var tmpCounter = 0;
    var data = new Object();

    var fuelGrades = [];
    var tanks = [];

    var dataFuelGradeIdNozzle1 = "0";
    var dataFuelGradeIdNozzle2 = "0";
    var dataFuelGradeIdNozzle3 = "0";
    var dataFuelGradeIdNozzle4 = "0";
    var dataFuelGradeIdNozzle5 = "0";
    var dataFuelGradeIdNozzle6 = "0";

    var dataTankIdNozzle1 = "0";
    var dataTankIdNozzle2 = "0";
    var dataTankIdNozzle3 = "0";
    var dataTankIdNozzle4 = "0";
    var dataTankIdNozzle5 = "0";
    var dataTankIdNozzle6 = "0";

    var values = [];
    var value = "";

    data.PumpNozzles = new Array();
    
    // Fill in pump nozzles
    for (tmpCounter = 0; tmpCounter < pumpNozzlesData.length; tmpCounter++) {
        if (pumpNozzlesData[tmpCounter].pumpId > 0) {

            fuelGrades = [];
            tanks = [];

            dataFuelGradeIdNozzle1 = pumpNozzlesData[tmpCounter].fuelGradeIdNozzle1;
            dataFuelGradeIdNozzle2 = pumpNozzlesData[tmpCounter].fuelGradeIdNozzle2;
            dataFuelGradeIdNozzle3 = pumpNozzlesData[tmpCounter].fuelGradeIdNozzle3;
            dataFuelGradeIdNozzle4 = pumpNozzlesData[tmpCounter].fuelGradeIdNozzle4;
            dataFuelGradeIdNozzle5 = pumpNozzlesData[tmpCounter].fuelGradeIdNozzle5;
            dataFuelGradeIdNozzle6 = pumpNozzlesData[tmpCounter].fuelGradeIdNozzle6;
        
            dataTankIdNozzle1 = pumpNozzlesData[tmpCounter].tankIdNozzle1;
            dataTankIdNozzle2 = pumpNozzlesData[tmpCounter].tankIdNozzle2;
            dataTankIdNozzle3 = pumpNozzlesData[tmpCounter].tankIdNozzle3;
            dataTankIdNozzle4 = pumpNozzlesData[tmpCounter].tankIdNozzle4;
            dataTankIdNozzle5 = pumpNozzlesData[tmpCounter].tankIdNozzle5;
            dataTankIdNozzle6 = pumpNozzlesData[tmpCounter].tankIdNozzle6;

            if (dataFuelGradeIdNozzle1 == "0" &&
                dataFuelGradeIdNozzle2 == "0" &&
                dataFuelGradeIdNozzle3 == "0" &&
                dataFuelGradeIdNozzle4 == "0" &&
                dataFuelGradeIdNozzle5 == "0" &&
                dataFuelGradeIdNozzle6 == "0" &&
                dataTankIdNozzle1 == "0" &&
                dataTankIdNozzle2 == "0" &&
                dataTankIdNozzle3 == "0" &&
                dataTankIdNozzle4 == "0" &&
                dataTankIdNozzle5 == "0" &&
                dataTankIdNozzle6 == "0") {
                // Do not add anything
            } else {

                value = 0;
                if (dataFuelGradeIdNozzle1 != "0") {
                    values = dataFuelGradeIdNozzle1.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("GRADE") + " ").length > 1) {
                        value = values[0].split(localizeString("GRADE") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            fuelGrades.push(parseInt(value, 10));
                        }
                    }
                }
                if (fuelGrades.length < 1) {
                    fuelGrades.push(value);
                }

                value = 0;
                if (dataFuelGradeIdNozzle2 != "0") {
                    values = dataFuelGradeIdNozzle2.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("GRADE") + " ").length > 1) {
                        value = values[0].split(localizeString("GRADE") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            fuelGrades.push(parseInt(value, 10));
                        }
                    }
                }
                if (fuelGrades.length < 2) {
                    fuelGrades.push(value);
                }

                value = 0;
                if (dataFuelGradeIdNozzle3 != "0") {
                    values = dataFuelGradeIdNozzle3.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("GRADE") + " ").length > 1) {
                        value = values[0].split(localizeString("GRADE") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            fuelGrades.push(parseInt(value, 10));
                        }
                    }
                }
                if (fuelGrades.length < 3) {
                    fuelGrades.push(value);
                }

                value = 0;
                if (dataFuelGradeIdNozzle4 != "0") {
                    values = dataFuelGradeIdNozzle4.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("GRADE") + " ").length > 1) {
                        value = values[0].split(localizeString("GRADE") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            fuelGrades.push(parseInt(value, 10));
                        }
                    }
                }
                if (fuelGrades.length < 4) {
                    fuelGrades.push(value);
                }

                value = 0;
                if (dataFuelGradeIdNozzle5 != "0") {
                    values = dataFuelGradeIdNozzle5.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("GRADE") + " ").length > 1) {
                        value = values[0].split(localizeString("GRADE") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            fuelGrades.push(parseInt(value, 10));
                        }
                    }
                }
                if (fuelGrades.length < 5) {
                    fuelGrades.push(value);
                }

                value = 0;
                if (dataFuelGradeIdNozzle6 != "0") {
                    values = dataFuelGradeIdNozzle6.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("GRADE") + " ").length > 1) {
                        value = values[0].split(localizeString("GRADE") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            fuelGrades.push(parseInt(value, 10));
                        }
                    }
                }
                if (fuelGrades.length < 6) {
                    fuelGrades.push(value);
                }

                value = 0;
                if (dataTankIdNozzle1 != "0") {
                    values = dataTankIdNozzle1.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("TANK") + " ").length > 1) {
                        value = values[0].split(localizeString("TANK") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            tanks.push(parseInt(value, 10));
                        }
                    }
                }
                if (tanks.length < 1) {
                    tanks.push(value);
                }

                value = 0;
                if (dataTankIdNozzle2 != "0") {
                    values = dataTankIdNozzle2.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("TANK") + " ").length > 1) {
                        value = values[0].split(localizeString("TANK") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            tanks.push(parseInt(value, 10));
                        }
                    }
                }
                if (tanks.length < 2) {
                    tanks.push(value);
                }

                value = 0;
                if (dataTankIdNozzle3 != "0") {
                    values = dataTankIdNozzle3.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("TANK") + " ").length > 1) {
                        value = values[0].split(localizeString("TANK") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            tanks.push(parseInt(value, 10));
                        }
                    }
                }
                if (tanks.length < 3) {
                    tanks.push(value);
                }

                value = 0;
                if (dataTankIdNozzle4 != "0") {
                    values = dataTankIdNozzle4.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("TANK") + " ").length > 1) {
                        value = values[0].split(localizeString("TANK") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            tanks.push(parseInt(value, 10));
                        }
                    }
                }
                if (tanks.length < 4) {
                    tanks.push(value);
                }

                value = 0;
                if (dataTankIdNozzle5 != "0") {
                    values = dataTankIdNozzle5.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("TANK") + " ").length > 1) {
                        value = values[0].split(localizeString("TANK") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            tanks.push(parseInt(value, 10));
                        }
                    }
                }
                if (tanks.length < 5) {
                    tanks.push(value);
                }
                
                value = 0;
                if (dataTankIdNozzle6 != "0") {
                    values = dataTankIdNozzle6.split(' (');
                    if (values.length > 1 &&
                        values[0].split(localizeString("TANK") + " ").length > 1) {
                        value = values[0].split(localizeString("TANK") + " ")[1];
                        if (parseInt(value, 10) >= 0 &&
                            parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                            tanks.push(parseInt(value, 10));
                        }
                    }
                }
                if (tanks.length < 6) {
                    tanks.push(value);
                }

                if (fuelGrades.length > 0 &&
                    tanks.length > 0) {
                    data.PumpNozzles.push({
                        PumpId: pumpNozzlesData[tmpCounter].pumpId,
                        FuelGradeIds: fuelGrades,
                        TankIds: tanks
                    });
                } else if (fuelGrades.length > 0) {
                    data.PumpNozzles.push({
                        PumpId: pumpNozzlesData[tmpCounter].pumpId,
                        FuelGradeIds: fuelGrades
                    });
                } else {
                    data.PumpNozzles.push({
                        PumpId: pumpNozzlesData[tmpCounter].pumpId,
                        TankIds: tanks
                    });
                }
            }          
        }
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetPriceBoardsConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetPriceBoardsConfiguration(priceBoardPortsData, priceBoardsData) {
    var tmpCounter = 0;    
    var data = new Object();
    var fuelGrades = [];

    var dataFuelGradeId1 = "0";
    var dataFuelGradeId2 = "0";
    var dataFuelGradeId3 = "0";
    var dataFuelGradeId4 = "0";
    var dataFuelGradeId5 = "0";
    var dataFuelGradeId6 = "0";
    var dataFuelGradeId7 = "0";
    var dataFuelGradeId8 = "0";
    var dataFuelGradeId9 = "0";
    var dataFuelGradeId10 = "0";

    var values = [];
    var value = "";

    data.Ports = new Array();
    
    // Fill in priceBoard ports
    if (priceBoardPortsData[0].communicationProtocol.split('.')[0] != "0" &&
        priceBoardPortsData[0].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "DISP",
            Protocol: parseInt(priceBoardPortsData[0].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(priceBoardPortsData[0].baudRate.split('.')[0], 10)
        });
    }
    if (priceBoardPortsData[1].communicationProtocol.split('.')[0] != "0" &&
        priceBoardPortsData[1].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "LOG",
            Protocol: parseInt(priceBoardPortsData[1].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(priceBoardPortsData[1].baudRate.split('.')[0], 10)
        });
    }
    if (priceBoardPortsData[2].communicationProtocol.split('.')[0] != "0" &&
        priceBoardPortsData[2].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "USER",
            Protocol: parseInt(priceBoardPortsData[2].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(priceBoardPortsData[2].baudRate.split('.')[0], 10)
        });
    }
    
    data.PriceBoards = new Array();

    // Fill in priceBoards
    for (tmpCounter = 0; tmpCounter < priceBoardsData.length; tmpCounter++) {
        if (priceBoardsData[tmpCounter].priceBoardPort.split(' ')[0] != "0" &&
            priceBoardsData[tmpCounter].communicationAddress.split(' ')[0] != "0") {

            dataFuelGradeId1 = priceBoardsData[tmpCounter].fuelGradeId1;
            dataFuelGradeId2 = priceBoardsData[tmpCounter].fuelGradeId2;
            dataFuelGradeId3 = priceBoardsData[tmpCounter].fuelGradeId3;
            dataFuelGradeId4 = priceBoardsData[tmpCounter].fuelGradeId4;
            dataFuelGradeId5 = priceBoardsData[tmpCounter].fuelGradeId5;
            dataFuelGradeId6 = priceBoardsData[tmpCounter].fuelGradeId6;
            dataFuelGradeId7 = priceBoardsData[tmpCounter].fuelGradeId7;
            dataFuelGradeId8 = priceBoardsData[tmpCounter].fuelGradeId8;
            dataFuelGradeId9 = priceBoardsData[tmpCounter].fuelGradeId9;
            dataFuelGradeId10 = priceBoardsData[tmpCounter].fuelGradeId10;

            value = 0;
            if (dataFuelGradeId1 != "0") {
                values = dataFuelGradeId1.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 1) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId2 != "0") {
                values = dataFuelGradeId2.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 2) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId3 != "0") {
                values = dataFuelGradeId3.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 3) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId4 != "0") {
                values = dataFuelGradeId4.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 4) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId5 != "0") {
                values = dataFuelGradeId5.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 5) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId6 != "0") {
                values = dataFuelGradeId6.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 6) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId7 != "0") {
                values = dataFuelGradeId7.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 7) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId8 != "0") {
                values = dataFuelGradeId8.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 8) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId9 != "0") {
                values = dataFuelGradeId9.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 9) {
                fuelGrades.push(value);
            }

            value = 0;
            if (dataFuelGradeId10 != "0") {
                values = dataFuelGradeId10.split(' (');
                if (values.length > 1 &&
                    values[0].split(localizeString("GRADE") + " ").length > 1) {
                    value = values[0].split(localizeString("GRADE") + " ")[1];
                    if (parseInt(value, 10) >= 0 &&
                        parseInt(value, 10) <= TOTAL_FUEL_GRADES) {
                        fuelGrades.push(parseInt(value, 10));
                    }
                }
            }
            if (fuelGrades.length < 10) {
                fuelGrades.push(value);
            }

            if (priceBoardsData[tmpCounter].priceBoardPort == "DISP") {
                data.PriceBoards.push({
                    Id: parseInt(priceBoardsData[tmpCounter].priceBoard, 10),
                    Port: "DISP",
                    Address: parseInt(priceBoardsData[tmpCounter].communicationAddress.split(' ')[0], 10),
                    FuelGradeIds: fuelGrades
                });
            } else if (priceBoardsData[tmpCounter].priceBoardPort == "LOG") {
                data.PriceBoards.push({
                    Id: parseInt(priceBoardsData[tmpCounter].priceBoard, 10),
                    Port: "LOG",
                    Address: parseInt(priceBoardsData[tmpCounter].communicationAddress.split(' ')[0], 10),
                    FuelGradeIds: fuelGrades
                });
            } else if (priceBoardsData[tmpCounter].priceBoardPort == "USER") {
                data.PriceBoards.push({
                    Id: parseInt(priceBoardsData[tmpCounter].priceBoard, 10),
                    Port: "USER",
                    Address: parseInt(priceBoardsData[tmpCounter].communicationAddress.split(' ')[0], 10),
                    FuelGradeIds: fuelGrades
                });
            } else {
                data.PriceBoards.push({
                    Id: parseInt(priceBoardsData[tmpCounter].priceBoard, 10),
                    Port: "0",
                    Address: parseInt(priceBoardsData[tmpCounter].communicationAddress.split(' ')[0], 10),
                    FuelGradeIds: fuelGrades
                });
            }
        }
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetReadersConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetReadersConfiguration(readerPortsData, readersData) {
    var tmpCounter = 0;    
    var data = new Object();

    var values = [];
    var value = "";

    data.Ports = new Array();
    
    // Fill in reader ports
    if (readerPortsData[0].communicationProtocol.split('.')[0] != "0" &&
        readerPortsData[0].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "DISP",
            Protocol: parseInt(readerPortsData[0].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(readerPortsData[0].baudRate.split('.')[0], 10)
        });
    }
    if (readerPortsData[1].communicationProtocol.split('.')[0] != "0" &&
        readerPortsData[1].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "LOG",
            Protocol: parseInt(readerPortsData[1].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(readerPortsData[1].baudRate.split('.')[0], 10)
        });
    }
    if (readerPortsData[2].communicationProtocol.split('.')[0] != "0" &&
        readerPortsData[2].baudRate.split('.')[0] != "0") {
        data.Ports.push({
            Id: "USER",
            Protocol: parseInt(readerPortsData[2].communicationProtocol.split('.')[0], 10),
            BaudRate: parseInt(readerPortsData[2].baudRate.split('.')[0], 10)
        });
    }
    
    data.Readers = new Array();

    // Fill in readers
    for (tmpCounter = 0; tmpCounter < readersData.length; tmpCounter++) {
        if (readersData[tmpCounter].readerPort.split(' ')[0] != "0" &&
            readersData[tmpCounter].communicationAddress.split(' ')[0] != "0") {

            if (readersData[tmpCounter].readerPort == "DISP") {
                data.Readers.push({
                    Id: parseInt(readersData[tmpCounter].reader, 10),
                    Port: "DISP",
                    Address: parseInt(readersData[tmpCounter].communicationAddress.split(' ')[0], 10),
                    PumpId: parseInt(readersData[tmpCounter].pumpId, 10)
                });
            } else if (readersData[tmpCounter].readerPort == "LOG") {
                data.Readers.push({
                    Id: parseInt(readersData[tmpCounter].reader, 10),
                    Port: "LOG",
                    Address: parseInt(readersData[tmpCounter].communicationAddress.split(' ')[0], 10),
                    PumpId: parseInt(readersData[tmpCounter].pumpId, 10)
                });
            } else if (readersData[tmpCounter].readerPort == "USER") {
                data.Readers.push({
                    Id: parseInt(readersData[tmpCounter].reader, 10),
                    Port: "USER",
                    Address: parseInt(readersData[tmpCounter].communicationAddress.split(' ')[0], 10),
                    PumpId: parseInt(readersData[tmpCounter].pumpId, 10)
                });
            } else {
                data.Readers.push({
                    Id: parseInt(readersData[tmpCounter].reader, 10),
                    Port: "0",
                    Address: parseInt(readersData[tmpCounter].communicationAddress.split(' ')[0], 10),
                    PumpId: parseInt(readersData[tmpCounter].pumpId, 10)
                });
            }
        }
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetTagsList() {
    return;
}

//-------------------------------------------------------------------------------------
function SetTagsList(tagsData) {
    var tmpCounter = 0;
    var data = new Array();
    
    for (tmpCounter = 0; tmpCounter < tagsData.length; tmpCounter++) {
        data.push({
            Tag: tagsData[tmpCounter].tag,
            Name: tagsData[tmpCounter].name,
            Valid: tagsData[tmpCounter].valid
        });
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetTagInformation() {
    return;
}

//-------------------------------------------------------------------------------------
function GetTanksConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetTanksConfiguration(tanksData) {
    var tmpCounter = 0;
    var data = new Object();

    data.Tanks = new Array();
    
    for (tmpCounter = 0; tmpCounter < tanksData.length; tmpCounter++) {
        if (tanksData[tmpCounter].fuelGradeId != "" && tanksData[tmpCounter].height > 0) {
            data.Tanks.push({
                Id: parseInt(tanksData[tmpCounter].id, 10),
                FuelGradeId: (tanksData[tmpCounter].fuelGradeId.split(' (').length > 1 && 
                              tanksData[tmpCounter].fuelGradeId.split(' (')[0].split(localizeString("GRADE") + " ").length > 1 &&
                              parseInt(tanksData[tmpCounter].fuelGradeId.split(' (')[0].split(localizeString("GRADE") + " ")[1], 10) >= 0 &&
                              parseInt(tanksData[tmpCounter].fuelGradeId.split(' (')[0].split(localizeString("GRADE") + " ")[1], 10) <= TOTAL_FUEL_GRADES) ? parseInt(tanksData[tmpCounter].fuelGradeId.split(' (')[0].split(localizeString("GRADE") + " ")[1], 10) : "0",
                Height: parseInt(tanksData[tmpCounter].height, 10),
                CriticalHighProductAlarmHeight: parseInt(tanksData[tmpCounter].criticalHighProductAlarmHeight, 10),
                HighProductAlarmHeight: parseInt(tanksData[tmpCounter].highProductAlarmHeight, 10),
                CriticalLowProductAlarmHeight: parseInt(tanksData[tmpCounter].criticalLowProductAlarmHeight, 10),
                LowProductAlarmHeight: parseInt(tanksData[tmpCounter].lowProductAlarmHeight, 10),
                HighWaterAlarmHeight: parseInt(tanksData[tmpCounter].highWaterAlarmHeight, 10),
                StopPumpsAtCriticalLowProductHeight: tanksData[tmpCounter].stopPumpsAtCriticalLowProductHeight
            });
        }
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetParameter(parameterDevice, parameterNumber, parameterAddress) {    
    var data = new Object();
    data.Device = parameterDevice;
    data.Number = parseInt(parameterNumber, 10);
    data.Address = parseInt(parameterAddress, 10);

    return data;
}

//-------------------------------------------------------------------------------------
function SetParameter(parameterDevice, parameterNumber, parameterAddress, parameterValue) {
    var data = new Object();
    data.Device = parameterDevice;
    data.Number = parseInt(parameterNumber, 10);
    data.Address = parseInt(parameterAddress, 10);
    data.Value = parameterValue;

    return data;
}

//-------------------------------------------------------------------------------------
function GetUsersConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetUsersConfiguration(usersData) {
    var tmpCounter = 0;
    var data = new Object();

    data.Users = new Array();
    
    // Fill in users
    for (tmpCounter = 0; tmpCounter < usersData.length; tmpCounter++) {
        if (usersData[tmpCounter].login.length > 0) {

            var permissions = new Object();
            permissions["Configuration"] = usersData[tmpCounter].configurationPermission;
            permissions["Control"] = usersData[tmpCounter].controlPermission;
            permissions["Monitoring"] = usersData[tmpCounter].monitoringPermission;
            permissions["Reports"] = usersData[tmpCounter].reportsPermission;

            data.Users.push({
                Id: usersData[tmpCounter].userId,
                Login: usersData[tmpCounter].login.toString(),
                Password: usersData[tmpCounter].password.toString(),
                Permissions: permissions
            });
        }
    }

    return data;
}

//-------------------------------------------------------------------------------------
function GetSystemDecimalDigits() {
    return;
}

//-------------------------------------------------------------------------------------
function GetPortLoggingConfiguration() {
    return;
}

//-------------------------------------------------------------------------------------
function SetPortLoggingConfiguration(port, dateTimeStop) {
    var data = new Object();

    data.Port = port;
    data.DateTimeStop = dateTimeStop;
    
    return data;
}

//-------------------------------------------------------------------------------------
function PumpGetStatus(pumpNumber) {
    var data = new Object();

    data.Pump = pumpNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpAuthorize(pumpNumber, nozzleNumber, presetType, presetDose, price) {
    var data = new Object();

    data.Pump = pumpNumber;
    data.Nozzle = nozzleNumber;
    data.Type = presetType;
    if (data.Type == "Volume" ||
        data.Type == "Amount") {
        data.Dose = presetDose;
    }
    data.Price = price;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpStop(pumpNumber) {
    var data = new Object();

    data.Pump = pumpNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpEmergencyStop(pumpNumber) {
    var data = new Object();

    data.Pump = pumpNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpResume(pumpNumber) {
    var data = new Object();

    data.Pump = pumpNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpSuspend(pumpNumber) {
    var data = new Object();

    data.Pump = pumpNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpCloseTransaction(pumpNumber, transactionNumber) {
    var data = new Object();

    data.Pump = pumpNumber;
    data.Transaction = transactionNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpGetTotals(pumpNumber, nozzleNumber) {
    var data = new Object();

    data.Pump = pumpNumber;
    data.Nozzle = nozzleNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpSetPrices(pumpNumber, priceNozzle1, priceNozzle2, priceNozzle3, priceNozzle4, priceNozzle5, priceNozzle6) {
    var data = new Object();

    data.Pump = pumpNumber;

    data.Prices = new Array();
    data.Prices.push(priceNozzle1);
    data.Prices.push(priceNozzle2);
    data.Prices.push(priceNozzle3);
    data.Prices.push(priceNozzle4);
    data.Prices.push(priceNozzle5);
    data.Prices.push(priceNozzle6);

    return data;
}

//-------------------------------------------------------------------------------------
function PumpGetPrices(pumpNumber) {
    var data = new Object();

    data.Pump = pumpNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpGetTag(pumpNumber, nozzleNumber) {
    var data = new Object();

    data.Pump = pumpNumber;
    data.Nozzle = nozzleNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function PumpSetLights(pumpNumber, state) {
    var data = new Object();

    data.Pump = pumpNumber;
    data.State = state;

    return data;
}

//-------------------------------------------------------------------------------------
function ProbeGetMeasurements(probeNumber) {
    var data = new Object();

    data.Probe = probeNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function ProbeGetTankVolumeForHeight(tankNumber, height) {
    var data = new Object();

    data.Probe = tankNumber;
    data.Height = height;

    return data;
}

//-------------------------------------------------------------------------------------
function PriceBoardGetStatus(priceBoardNumber) {
    var data = new Object();

    data.PriceBoard = priceBoardNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function ReaderGetTag(readerNumber) {
    var data = new Object();

    data.Reader = readerNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function ReaderGetStatus(readerNumber) {
    var data = new Object();

    data.Reader = readerNumber;

    return data;
}

//-------------------------------------------------------------------------------------
function ReportGetPumpTransactions(pumpNumber, dateTimeStart, dateTimeEnd) {
    var data = new Object();

    data.Pump = pumpNumber;
    data.DateTimeStart = dateTimeStart;
    data.DateTimeEnd = dateTimeEnd;

    return data;
}

//-------------------------------------------------------------------------------------
function ReportGetTankMeasurements(tankNumber, dateTimeStart, dateTimeEnd) {
    var data = new Object();

    data.Tank = tankNumber;
    data.DateTimeStart = dateTimeStart;
    data.DateTimeEnd = dateTimeEnd;

    return data;
}

//-------------------------------------------------------------------------------------
function ReportGetGpsRecords(dateTimeStart, dateTimeEnd) {
    var data = new Object();

    data.DateTimeStart = dateTimeStart;
    data.DateTimeEnd = dateTimeEnd;

    return data;
}

//-------------------------------------------------------------------------------------
function MakeDiagnostics() {
    var data = new Object();
    return data;
}

//-------------------------------------------------------------------------------------
function sendRequest(requestString, showLoader = true, timeoutValue = 10000) {
    // Show busyLoader
    if (showLoader == true)
        showBusyLoader();

    var username = 'admin';
    var password = 'admin';
    var url = 'http://192.168.50.117/jsonPTS';

    responseNull = false;

    // Send request to server
    return $.ajax({
        type: "POST",
        url: url,
        data: requestString,
        cache: false,
        dataType: 'json',
        headers: {
			'Authorization': 'Basic ' + btoa(username + ':' + password),
		},
        processData: false, // Don't process the files
        contentType: "application/json; charset=utf-8", // Set content type to false as jQuery will tell the server its a query string request
        timeout: timeoutValue,  // 10 seconds timeout for response
        success: function (responseData) {            
            // Hide busyLoader
            if (showLoader == true)
                hideBusyLoader();
            
            // Display error message
            if (responseData.Error != undefined && responseData.Error == true) {
                if (responseData.Message != undefined) {

                    if (responseData.Data != undefined) {
                        var errorData = "";
                        
                        for (var key in responseData.Data) {
                            errorData += localizeString(key.toUpperCase()) + " " + localizeString(responseData.Data[key]) + ", ";
                        }
                        
                        if (errorData.length > 0) {
                            errorData = errorData.substring(0, errorData.length - 2);
                        }

                        showMessage(localizeString(responseData.Message) + ": " + errorData);
                    } else {
                        showMessage(localizeString(responseData.Message));
                    }
                }
                
                responseNull = true;
            } else {
                // Check all responses with error
                if (responseData.Packets == undefined ||
                    responseData.Packets == null) {
                    responseNull = true;
                } else {
                    if (responseData.Packets.length > 0) {
                        responseData.Packets.forEach(function(packet) {
                            if (packet.Error != undefined && packet.Error == true) {
                                if (packet.Message != undefined) {
                
                                    if (packet.Data != undefined) {
                                        var errorData = "";
                                        
                                        for (var key in packet.Data) {
                                            errorData += localizeString(key.toUpperCase()) + " " + localizeString(packet.Data[key]) + ", ";
                                        }
                                        
                                        if (errorData.length > 0) {
                                            errorData = errorData.substring(0, errorData.length - 2);
                                        }

                                        showMessage(localizeString(packet.Message) + ": " + errorData);
                                    } else {
                                        showMessage(localizeString(packet.Message));
                                    }
                                }

                                //responseNull = true;
                            }
                        });
                    }
                }
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {            
            // Hide busyLoader
            if (showLoader == true)
                hideBusyLoader();               
                
            responseNull = true;

            if (ajaxOptions === 'timeout')
                console.log(localizeString("AJAX_TIMEOUT_EXPIRED"));
        }
    });
}

//-------------------------------------------------------------------------------------
//--------------------------------- Pts_config.json -----------------------------------
//-------------------------------------------------------------------------------------

function getPtsConfigPumpProtocolsList() {
    // Check if Pts_config file is present
    if (ptsConfig == null)
    {
        console.log("getPtsConfigPumpProtocolsList: " + localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        alert(localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        return null;
    }

    // List of pump protocols
    var protocols = [];
    
    // Fill list of pump protocols
    ptsConfig.configuration.protocols.protocol.forEach(function(item, i, array) {
        if (item.type == "0") {
            protocols.push({
                "index": item.index,
                "value": item.name
            });
        }
    });

    return protocols;
}

//-------------------------------------------------------------------------------------
function getPtsConfigProbeProtocolsList() {
    // Check if Pts_config file is present
    if (ptsConfig == null)
    {
        console.log("getPtsConfigProbeProtocolsList: " + localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        alert(localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        return null;
    }

    // List of pump protocols
    var protocols = [];
    
    // Fill list of pump protocols
    ptsConfig.configuration.protocols.protocol.forEach(function(item, i, array) {
        if (item.type == "1") {
            protocols.push({
                "index": item.index,
                "value": item.name
            });
        }
    });

    return protocols;
}

//-------------------------------------------------------------------------------------
function getPtsConfigPriceBoardProtocolsList() {
    // Check if Pts_config file is present
    if (ptsConfig == null)
    {
        console.log("getPtsConfigPriceBoardProtocolsList: " + localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        alert(localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        return null;
    }

    // List of pump protocols
    var protocols = [];
    
    // Fill list of pump protocols
    ptsConfig.configuration.protocols.protocol.forEach(function(item, i, array) {
        if (item.type == "2") {
            protocols.push({
                "index": item.index,
                "value": item.name
            });
        }
    });

    return protocols;
}

//-------------------------------------------------------------------------------------
function getPtsConfigReaderProtocolsList() {
    // Check if Pts_config file is present
    if (ptsConfig == null)
    {
        console.log("getPtsConfigReaderProtocolsList: " + localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        alert(localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        return null;
    }

    // List of pump protocols
    var protocols = [];
    
    // Fill list of pump protocols
    ptsConfig.configuration.protocols.protocol.forEach(function(item, i, array) {
        if (item.type == "3") {
            protocols.push({
                "index": item.index,
                "value": item.name
            });
        }
    });

    return protocols;
}

//-------------------------------------------------------------------------------------
function getPtsConfigBaudRatesList() {
    // Check if Pts_config file is present
    if (ptsConfig == null)
    {
        console.log("getPtsConfigBaudRatesList: " + localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        alert(localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        return null;
    }

    // List of baud rates
    var baudRates = [];
    
    // Fill list of baud rates
    ptsConfig.configuration.bauds.baud.forEach(function(item, i, array) {
        baudRates.push({
            "index": item.index,
            "value": item.rate
        });
    });

    return baudRates;
}

//-------------------------------------------------------------------------------------
function getPtsConfigParametersPts() {
    // Check if Pts_config file is present
    if (ptsConfig == null)
    {
        console.log("getPtsConfigParametersPts: " + localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        alert(localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        return null;
    }

    // List of baud rates
    var parameters = [];
    
    // Fill list of parameters
    ptsConfig.configuration.params.param.forEach(function(parameter, counter, array) {
        if (parameter.type == ParametersTypeEnum.PARAMETERS_TYPE_PTS2.toString()) {
            parameter.input.value = 0;
            parameters.push(parameter);
        }
    });

    return parameters;
}

//-------------------------------------------------------------------------------------
function getPtsConfigParametersPump(protocolNumber) {
    // Check if Pts_config file is present
    if (ptsConfig == null)
    {
        console.log("getPtsConfigParametersPump: " + localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        alert(localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        return null;
    }

    // List of baud rates
    var parameters = [];
    
    // Fill list of parameters
    ptsConfig.configuration.params.param.forEach(function(parameter, counter, array) {
        if (parameter.type == ParametersTypeEnum.PARAMETERS_TYPE_PUMP.toString() &&
            parameter.protocol == parseInt(protocolNumber, 10)) {
            parameter.input.value = 0;
            parameters.push(parameter);
        }
        if (parameter.type == ParametersTypeEnum.PARAMETERS_TYPE_PUMP_COMMON.toString()) {
            parameter.input.value = 0;
            parameters.push(parameter);
        }
    });

    return parameters;
}

//-------------------------------------------------------------------------------------
function getPtsConfigParametersProbe(protocolNumber) {
    // Check if Pts_config file is present
    if (ptsConfig == null)
    {
        console.log("getPtsConfigParametersProbe: " + localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        alert(localizeString("CONFIGURATION_FILE_NOT_FOUND"));
        return null;
    }

    // List of baud rates
    var parameters = [];
    
    // Fill list of parameters
    ptsConfig.configuration.params.param.forEach(function(parameter, counter, array) {
        if (parameter.type == ParametersTypeEnum.PARAMETERS_TYPE_PROBE.toString() &&
            parameter.protocol == parseInt(protocolNumber, 10)) {
            parameter.input.value = 0;
            parameters.push(parameter);
        }
        if (parameter.type == ParametersTypeEnum.PARAMETERS_TYPE_PROBE_COMMON.toString()) {
            parameter.input.value = 0;
            parameters.push(parameter);
        }
    });

    return parameters;
}

//-------------------------------------------------------------------------------------