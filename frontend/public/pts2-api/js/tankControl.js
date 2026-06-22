let TANK_PRODUCT_COLOR = "lightgreen";
let TANK_OFFLINE_DISCONNECTED_COLOR = "lightgrey";
let TANK_ERROR_COLOR = "red";

class Tank {
    constructor(Id) {
        this._id = Id;
        this._status = localizeString("OFFLINE");
        this._gradeCode = 0;
        this._gradeName = "";
        this._height = 0;
        this._fillingPercentage = 0;
        this._productHeight = 0;
        this._waterHeight = 0;
        this._temperature = 0;
        this._productVolume = 0;
        this._waterVolume = 0;
        this._productUllage = 0;
        this._productTCVolume = 0;
        this._productDensity = 0;
        this._productMass = 0;
        this._highProductAlarmPresent = false;
        this._lowProductAlarmPresent = false;
        this._criticalHighProductAlarmPresent = false;
        this._criticalLowProductAlarmPresent = false;
        this._highWaterAlarmPresent = false;
    }

    get Id() {
        return this._id;
    }

    get Status() {
        return this._status;
    }

    set Status(status) {
        this._status = status;
    }
    
    set GradeCode(gradeCode) {
        this._gradeCode = gradeCode;
    }

    get GradeName() {
        return this._gradeName;
    }

    set GradeName(gradeName) {
        this._gradeName = gradeName;
    }

    set Height(height) {
        this._height = height;
    }

    get ProductHeight() {
        return this._productHeight;
    }

    set ProductHeight(productHeight) {
        this._productHeight = productHeight;
    }

    set WaterHeight(waterHeight) {
        this._waterHeight = waterHeight;
    }

    set Temperature(temperature) {
        this._temperature = temperature;
    }

    set ProductVolume(productVolume) {
        this._productVolume = productVolume;
    }

    set WaterVolume(waterVolume) {
        this._waterVolume = waterVolume;
    }

    set ProductUllage(productUllage) {
        this._productUllage = productUllage;
    }

    set ProductTCVolume(productTCVolume) {
        this._productTCVolume = productTCVolume;
    }

    set ProductDensity(productDensity) {
        this._productDensity = productDensity;
    }

    set ProductMass(productMass) {
        this._productMass = productMass;
    }

    set ProductMass(productMass) {
        this._productMass = productMass;
    }

    set HighProductAlarmPresent(highProductAlarmPresent) {
        this._highProductAlarmPresent = highProductAlarmPresent;
    }

    set LowProductAlarmPresent(lowProductAlarmPresent) {
        this._lowProductAlarmPresent = lowProductAlarmPresent;
    }

    set CriticalHighProductAlarmPresent(criticalHighProductAlarmPresent) {
        this._criticalHighProductAlarmPresent = criticalHighProductAlarmPresent;
    }

    set CriticalLowProductAlarmPresent(criticalLowProductAlarmPresent) {
        this._criticalLowProductAlarmPresent = criticalLowProductAlarmPresent;
    }

    set HighWaterAlarmPresent(highWaterAlarmPresent) {
        this._highWaterAlarmPresent = highWaterAlarmPresent;
    }

    // Draw tank
    static Draw(tank) {
        if ($("#tmpTanks").length > 0) {
            $("#tmpTanks").append($(".tmpTankControlTemplate").clone().removeClass('tmpTankControlTemplate').removeClass('d-none').attr("id", "tmpTank" + tank._id.toString()));
        }
    }

    // Update tank in datatable
    static Update(tank) {        
        let tankColor = TANK_PRODUCT_COLOR;
        let tankFillingPercentage = "50";

        if (tank == null) {
            return;
        }        

        if ($("#tmpTank" + tank._id.toString()).length > 0) {
                        
            // Tank number
            if ($("#tmpTank" + tank._id.toString() + " .tmpTankNumber").val() != tank._id)
                $("#tmpTank" + tank._id.toString() + " .tmpTankNumber").text(tank._id.toString());
            
            // Fuel grade name
            if ($("#tmpTank" + tank._id.toString() + " .tmpFuelGradeName").val() != tank._gradeName)
                $("#tmpTank" + tank._id.toString() + " .tmpFuelGradeName").text(tank._gradeName);

            if (tank._status.toLowerCase() != "ok" &&
                tank._status.toLowerCase() != "error") {

                $("#tmpTank" + tank._id.toString() + " .table").addClass("d-none");
                $("#tmpTank" + tank._id.toString() + " .tmpWarningButton").addClass("d-none");
                $("#tmpTank" + tank._id.toString() + " .tmpDeliveryButton").addClass("d-none");
                $("#tmpTank" + tank._id.toString()).removeClass("border-danger").addClass("border-secondary");
                $("#tmpTank" + tank._id.toString() + " .tmpTankFillingPercentage").text(tank._status);
                tankFillingPercentage = 100;
                tankColor = TANK_OFFLINE_DISCONNECTED_COLOR;

            } else {
                $("#tmpTank" + tank._id.toString() + " .table").removeClass("d-none");

                // Filling percentage

                if (parseFloat(tank._productUllage) > 0 && 
                    parseFloat(tank._productVolume) > 0) {
                    tank._fillingPercentage = Math.round(parseFloat(tank._productVolume) * 100 / parseFloat(tank._productUllage + tank._productVolume));
                } else if (parseFloat(tank._height) > 0 && 
                    parseFloat(tank._productHeight) > 0) {
                    tank._fillingPercentage = Math.round(parseFloat(tank._productHeight) * 100 / parseFloat(tank._height));
                } else {
                    tank._fillingPercentage = "?";
                }

                if ($("#tmpTank" + tank._id.toString() + " .tmpTankFillingPercentage").val() != tank._fillingPercentage ||
                    tank._fillingPercentage == 0) {                    
                    $("#tmpTank" + tank._id.toString() + " .tmpTankFillingPercentage").text(tank._fillingPercentage.toString() + "%");
                }

                $("#tmpTank" + tank._id.toString() + " .jumbotron").removeAttr("style");
                if (tank._highProductAlarmPresent == true ||
                    tank._lowProductAlarmPresent == true ||
                    tank._criticalHighProductAlarmPresent == true ||
                    tank._criticalLowProductAlarmPresent == true ||
                    tank._highWaterAlarmPresent == true ||
                    tank._status.toLowerCase() == "error") {
                    tankColor = TANK_ERROR_COLOR;
                    $("#tmpTank" + tank._id.toString() + " .tmpWarningButton").removeClass("d-none");
                    $("#tmpTank" + tank._id.toString()).removeClass("border-secondary").addClass("border-danger");
                } else {
                    $("#tmpTank" + tank._id.toString() + " .tmpWarningButton").addClass("d-none");
                    $("#tmpTank" + tank._id.toString()).removeClass("border-danger").addClass("border-secondary");
                }                

                if (isNaN(tank._fillingPercentage) == true) {
                    tankFillingPercentage = 50;
                    tankColor = TANK_OFFLINE_DISCONNECTED_COLOR;
                } else {
                    tankFillingPercentage = tank._fillingPercentage.toString();

                    if (tankFillingPercentage == 0) {
                        tankFillingPercentage = 1;
                    }
                }
            }
            $("#tmpTank" + tank._id.toString() + " .jumbotron").attr("style", "background:-webkit-linear-gradient(bottom, " + tankColor + " " + tankFillingPercentage + "%, white " + tankFillingPercentage + "%);" + 
                                                                              "background:-moz-linear-gradient(bottom, " + tankColor + " " + tankFillingPercentage + "%, white " + tankFillingPercentage + "%);" + 
                                                                              "background:-ms-linear-gradient(bottom, " + tankColor + " " + tankFillingPercentage + "%, white " + tankFillingPercentage + "%);" + 
                                                                              "background:linear-gradient(bottom, " + tankColor + " " + tankFillingPercentage + "%, white " + tankFillingPercentage + "%);");
            
            // Remove all tank measurements
            $("#tmpTank" + tank._id.toString() + " table tbody").empty();

            // Product height
            if (tank._productHeight != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankProductHeight").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankProductHeight").html(tank._productHeight.toString() + " " + HEIGHT_UNITS);
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + PRODUCT_HEIGHT + "</th><td class='text-left pt-0 pb-0 w-50 tankProductHeight'>" + tank._productHeight.toString() + " " + HEIGHT_UNITS + "</td>");
                }
            }
            
            // Product volume
            if (tank._productVolume != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankProductVolume").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankProductVolume").html(tank._productVolume.toString() + " " + getVolumeUnit());
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + PRODUCT_VOLUME + "</th><td class='text-left pt-0 pb-0 w-50 tankProductVolume'>" + tank._productVolume.toString() + " " + getVolumeUnit() + "</td>");
                }
            }
            
            // Product TC volume
            if (tank._productTCVolume != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankProductTCVolume").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankProductTCVolume").html(tank._productTCVolume.toString() + " " + getVolumeUnit());
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + PRODUCT_TC_VOLUME + "</th><td class='text-left pt-0 pb-0 w-50 tankProductTCVolume'>" + tank._productTCVolume.toString() + " " + getVolumeUnit() + "</td>");
                }
            }
            
            // Product ullage
            if (tank._productUllage != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankProductUllage").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankProductUllage").html(tank._productUllage.toString() + " " + getVolumeUnit());
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + PRODUCT_ULLAGE + "</th><td class='text-left pt-0 pb-0 w-50 tankProductUllage'>" + tank._productUllage.toString() + " " + getVolumeUnit() + "</td>");
                }
            }
            
            // Water height
            if (tank._waterHeight != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankWaterHeight").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankWaterHeight").html(tank._waterHeight.toString() + " " + HEIGHT_UNITS);
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + WATER_HEIGHT + "</th><td class='text-left pt-0 pb-0 w-50 tankWaterHeight'>" + tank._waterHeight.toString() + " " + HEIGHT_UNITS + "</td>");
                }
            }
            
            // Water volume
            if (tank._waterVolume != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankWaterVolume").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankWaterVolume").html(tank._waterVolume.toString() + " " + getVolumeUnit());
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + WATER_VOLUME + "</th><td class='text-left pt-0 pb-0 w-50 tankWaterVolume'>" + tank._waterVolume.toString() + " " + getVolumeUnit() + "</td>");
                }
            }
            
            // Temperature
            if (tank._temperature != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankTemperature").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankTemperature").html(tank._temperature.toString() + " " + getTemperatureUnit());
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + TEMPERATURE + "</th><td class='text-left pt-0 pb-0 w-50 tankTemperature'>" + tank._temperature.toString() + " " + getTemperatureUnit() + "</td>");
                }
            }
            
            // Product density
            if (tank._productDensity != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankProductDensity").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankProductDensity").html(tank._productDensity.toString() + " " + DENSITY_UNITS);
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + PRODUCT_DENSITY + "</th><td class='text-left pt-0 pb-0 w-50 tankProductDensity'>" + tank._productDensity.toString() + " " + DENSITY_UNITS + "</td>");
                }
            }
            
            // Product mass
            if (tank._productMass != "-") {
                if ($("#tmpTank" + tank._id.toString() + " th.tankProductMass").length > 0) {
                    $("#tmpTank" + tank._id.toString() + " th.tankProductMass").html(tank._productMass.toString() + " " + MASS_UNITS);
                } else {
                    $("#tmpTank" + tank._id.toString() + " table tbody").append("<tr><th class='text-right pt-0 pb-0 w-50'>" + PRODUCT_MASS + "</th><td class='text-left pt-0 pb-0 w-50 tankProductMass'>" + tank._productMass.toString() + " " + MASS_UNITS + "</td>");
                }
            }
        }
    }
}