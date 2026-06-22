// Common title
var WEB_SERVER_TITLE = "";

// Flag for SD error
var SD_ERROR = 0;

// Pump control type cookie
var PUMP_CONTROL_TYPE_COOKIE = "PumpControlTypeCookie";
var PUMP_CONTROL_TYPE_WIDGET = "PumpControlTypeWidget";
var PUMP_CONTROL_TYPE_TABLE = "PumpControlTypeTable";

// Pump preset type
var PUMP_PRESET_TYPE_COOKIE = "PumpPresetTypeCookie";
var PUMP_PRESET_TYPE_VOLUME = "Volume";
var PUMP_PRESET_TYPE_AMOUNT = "Amount";
var PUMP_PRESET_TYPE_FULL_TANK = "FullTank";

// Users
var SYSTEM_USER_DART_1_ID = 11;
var SYSTEM_USER_DART_1_NAME = "DART 1";
var SYSTEM_USER_DART_2_ID = 12;
var SYSTEM_USER_DART_2_NAME = "DART 2";
var SYSTEM_USER_DART_3_ID = 13;
var SYSTEM_USER_DART_3_NAME = "DART 3";
var SYSTEM_USER_DART_4_ID = 14;
var SYSTEM_USER_DART_4_NAME = "DART 4";
var SYSTEM_USER_UNIPUMP_ID = 15;
var SYSTEM_USER_UNIPUMP_NAME = "UNIPUMP";
var SYSTEM_USER_PTS_ID = 16;
var SYSTEM_USER_PTS_NAME = "PTS";

var SYSTEM_PRICE_DECIMAL_DIGITS = 2;
var SYSTEM_AMOUNT_DECIMAL_DIGITS = 2;
var SYSTEM_VOLUME_DECIMAL_DIGITS = 2;
var SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS = 2;
var SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS = 2;

//-------------------------------------------------------------------------------------
(function($) {
    // Start of use strict
    "use strict";

    // Browser viewport width
    var windowWidth = 0;

    // On document ready
    $(function() {
        
        // Assign initial browser viewport width
        windowWidth = Number(viewport().width);

        // Collapse side menu
        if (windowWidth >= 768) {
            $("body").addClass("sidenav-toggled");
        } else {
            // Remove navbar menu after click on link in small screen
            $('.navbar-collapse').collapse('hide');
        }

        displayUserInformation();

        // Logout
        $("#btnLogout").click(function(e) {
            ClearAuthentication();
        });
    });

    // On window resize adjust the navbar size
    $(window).resize(function() {
        // Show full side navigation menu in collapsed state
        if (viewport().width < 768 && Number(windowWidth) >= 768) {
            $("body").removeClass("sidenav-toggled");
            $("#sidenavTogglerArrow").addClass("fa-rotate-180");
            $(".navbar-sidenav .nav-link-collapse").addClass("collapsed");
            $(".navbar-sidenav .sidenav-second-level, .navbar-sidenav .sidenav-third-level").removeClass("show");
        } else if (viewport().width >= 768 && Number(windowWidth) < 768) {
            $("body").addClass("sidenav-toggled");
            $("#sidenavTogglerArrow").removeClass("fa-rotate-180");
        }

        windowWidth = Number(viewport().width);
    });

    // Remove navbar menu after click on link in small screen
    $('a.nav-link').click(function() {
        if (viewport().width < 768) {
            //$('button.navbar-toggler').click();

            // Remove navbar menu after click on link in small screen
            $('.navbar-collapse').collapse('hide');
        }
    });

    // Toggle the side navigation
    $("#sidenavToggler").click(function(e) {
        e.preventDefault();
        $("body").toggleClass("sidenav-toggled");
        $("#sidenavTogglerArrow").toggleClass("fa-rotate-180");
        $(".navbar-sidenav .nav-link-collapse").addClass("collapsed");
        $(".navbar-sidenav .sidenav-second-level, .navbar-sidenav .sidenav-third-level").removeClass("show");
    });

    // Force the toggled class to be removed when a collapsible nav link is clicked
    $(".navbar-sidenav .nav-link-collapse").click(function(e) {
        e.preventDefault();
        $("body").removeClass("sidenav-toggled");
        $("#sidenavTogglerArrow").addClass("fa-rotate-180");
    });

    // Scroll to top button
    $(document).scroll(function() {
        var scrollDistance = $(this).scrollTop();
        if (scrollDistance > 100) {
            $('.scroll-to-top').fadeIn();
        } else {
            $('.scroll-to-top').fadeOut();
        }
    });

    $('.scroll-to-top').click(function (event) {
        event.preventDefault();
        $('html, body').animate({ scrollTop: 0 }, 500);
        return false;
    });

    // Link clicked
    $('.pageLink').on('click', function (event) {
        event.preventDefault();

        $('.pageLink').removeClass("selected");
        $(this).addClass("selected");

        showPageContent(this.id);
        document.title = WEB_SERVER_TITLE;
        window.history.pushState(null, this.title, this.href); //update browser history
        return false;
    });
  
})(jQuery); // End of use strict

// Variable showing whether busyLoader is displayed
var busyLoaderIsOn = 0;

//-------------------------------------------------------------------------------------
function displayUserInformation(gotoDeviceInformationPage = false) {    
    var request = 0;
    var commands = [];
    var message = "";
    var data;
    var controllerFirmwareVersion = "";
    
    // Currently logged user
    var userPermissions = [];

    // Get currently logged user name
    commands = [];
    commands.push({
        function: GetLanguage
    },{
        function: GetMeasurementUnits
    },{
        function: GetUserInformation
    },{
        function: GetSdInformation
    },{
        function: GetBatteryVoltage
    },{
        function: GetFirmwareInformation
    });

    request = createComplexRequest(commands);

    // Process response
    request.done(function(response) {
        if (responseNull == true)
            return;

        message = "";

        data = response.Packets.filter(Packet => Packet.Type == "Language");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data != undefined &&
                data.Language != undefined) {

                if (data.Language.trim() != "" &&
                    (data.Language.trim() == "EN" || 
                     data.Language.trim() == "RU" || 
                     data.Language.trim() == "TR")) {
                    LANGUAGE = data.Language;

                    if (LANGUAGE == "RU") {
                        DATATABLES_LANGUAGE_FILE = 'dataTables.language_ru.json';
                        ptsConfig = ptsConfigRu;
                    } else if (LANGUAGE == "TR") {
                        DATATABLES_LANGUAGE_FILE = 'dataTables.language_tr.json';
                        ptsConfig = ptsConfigEn;
                    } else {
                        ptsConfig = ptsConfigEn;
                    }

                    configurationPumpProtocolsList = getPtsConfigPumpProtocolsList();
                    configurationProbeProtocolsList = getPtsConfigProbeProtocolsList();
                    configurationPriceBoardProtocolsList = getPtsConfigPriceBoardProtocolsList();
                    configurationReaderProtocolsList = getPtsConfigReaderProtocolsList();
                }
            }
        }

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
                controllerFirmwareVersion = data.DateTime[0] + data.DateTime[1] + data.DateTime[2] + data.DateTime[3] + "." + data.DateTime[5] + data.DateTime[6] + "." + data.DateTime[8] + data.DateTime[9] + " " + data.DateTime[11] + data.DateTime[12] + ":" + data.DateTime[14] + data.DateTime[15] + ":" + data.DateTime[17] + data.DateTime[18];
            }
        }

        data = response.Packets.filter(Packet => Packet.Type == "MeasurementUnits");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data != undefined) {
                
                if (data.Volume != undefined &&
                    data.Volume.trim() != "" &&
                    (data.Volume.trim() == "L" || data.Volume.trim() == "G")) {
                    VOLUME_UNITS = data.Volume;
                }
                
                if (data.Temperature != undefined &&
                    data.Temperature.trim() != "" &&
                    (data.Temperature.trim() == "C" || data.Temperature.trim() == "F")) {
                    TEMPERATURE_UNITS = data.Temperature;
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
                $(".usernameSpanLg").text(data.Login);
                $(".usernameSpanSm").text(data.Login);
                
                if (data.Permissions != undefined) {
                    userPermissions = data.Permissions;
                    
                    if ($('#PumpsControlPageLi').length > 0)
                        $('#PumpsControlPageLi').addClass("d-none");
                    
                    if ($('#TanksMonitoringPageLi').length > 0)
                        $('#TanksMonitoringPageLi').addClass("d-none");
                    
                    if ($('#ReportingPageLi').length > 0)
                        $('#ReportingPageLi').addClass("d-none");

                    if (userPermissions["Control"] == true ||
                        userPermissions["Monitoring"] == true) {
                        if ($('#ConfigurationPageLi').length > 0)
                            $('#ConfigurationPageLi').removeClass("d-none");

                        if ($('#PumpsControlPageLi').length > 0)
                            $('#PumpsControlPageLi').removeClass("d-none");
                            
                        if ($('#TanksMonitoringPageLi').length > 0)
                            $('#TanksMonitoringPageLi').removeClass("d-none");
                    }

                    if (userPermissions["Reports"] == true) {
                        if ($('#ReportingPageLi').length > 0)
                            $('#ReportingPageLi').removeClass("d-none");
                    }
        
                    if (window.location.href.indexOf("#") == -1) {
                        if ($('#DeviceInformationPageLi').length > 0) {
                            showPageContent("DeviceInformationPage");
                        } else {
                            showPageContent("PumpsControlPage");
                        } 
                        
                        document.title = WEB_SERVER_TITLE;
                    }
                }
            }
        }

        // No SD found
        data = response.Packets.filter(Packet => Packet.Type == "SdInformation");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            if (data[0].Error != undefined &&
                data[0].Error == true) {
                message += localizeString("SD_ERROR_FOUND");
                SD_ERROR = 1;
            } else
                SD_ERROR = 0;
        }

        data = response.Packets.filter(Packet => Packet.Type == "BatteryVoltage");
        if (data != null &&
            data != undefined &&
            data.length > 0) {
            data = data[0].Data;
            if (data != undefined) {
                if (message != "")
                    message += " ";
                
                if (data.Voltage > 2200 && data.Voltage <= 2500) {
                    message += localizeString("BATTERY_NEEDS_REPLACEMENT_SOON");
                } else if (data.Voltage <= 2200) {
                    message += localizeString("NO_BATTERY_FOUND_PLEASE_PLACE_BATTERY");
                }
            }
        }

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
                $('#firmwareRelease').append("<i><b>" + localizeString("RELEASE_DATETIME") + "</b>:</i> " + data.DateTime[8] + data.DateTime[9] + "." + data.DateTime[5] + data.DateTime[6] + "." + data.DateTime[0] + data.DateTime[1] + data.DateTime[2] + data.DateTime[3] + " " + data.DateTime[11] + data.DateTime[12] + ":" + data.DateTime[14] + data.DateTime[15] + ":" + data.DateTime[17] + data.DateTime[18]);
            }
        }

        // Localization
        $(".mpControllerName").text(localizeString("PTS_2_CONTROLLER"));
        $(".mpControllerLogoName").html("<b>" + localizeString("PTS_2_CONTROLLER") + "</b><i>" + localizeString("VER").toLowerCase() + " " + controllerFirmwareVersion + "</i>");
        $(".mpControllerLogo").html("<i class='fas fa-gas-pump fa-2x'></i>");
        $(".mpControllerBottomLogo").html("<i class='fas fa-gas-pump'></i>");
        $(".mpTechnotradeLLC").text(localizeString("TECHNOTRADE_LLC"));
        $(".mpTechnotradeWebsiteAddress").attr('href', localizeString("TECHNOTRADE_WEBSITE_ADDRESS"));
        WEB_SERVER_TITLE = localizeString("PTS_2_CONTROLLER_WEB_SERVER");
        document.title = WEB_SERVER_TITLE;

        $(".mpTabDeviceInformation").text(localizeString("TAB_DEVICE_INFORMATION"));
        $("#DeviceInformationPageLi").attr("title", localizeString("TAB_DEVICE_INFORMATION"));
        $(".mpTabConfiguration").text(localizeString("TAB_CONFIGURATION"));
        $("#ConfigurationPageLi").attr("title", localizeString("TAB_CONFIGURATION"));
        $(".mpTabPumpsControl").text(localizeString("TAB_PUMPS_CONTROL"));
        $("#PumpsControlPageLi").attr("title", localizeString("TAB_PUMPS_CONTROL"));
        $(".mpTabTanksMonitoring").text(localizeString("TAB_TANKS_MONITORING"));
        $("#TanksMonitoringPageLi").attr("title", localizeString("TAB_TANKS_MONITORING"));
        $(".mpTabReporting").text(localizeString("TAB_REPORTING"));
        $("#ReportingPageLi").attr("title", localizeString("TAB_REPORTING"));
        $(".mpTabLogging").text(localizeString("TAB_LOGGING"));
        $("#LoggingPageLi").attr("title", localizeString("TAB_LOGGING"));
        $(".mpTabSelfDiagnostics").text(localizeString("TAB_SELF_DIAGNOSTICS"));
        $("#SelfDiagnosticsPageLi").attr("title", localizeString("TAB_SELF_DIAGNOSTICS"));
        $(".mpTabFirmwareUpdate").text(localizeString("TAB_FIRMWARE_UPDATE"));
        $("#FirmwareUpdatePageLi").attr("title", localizeString("TAB_FIRMWARE_UPDATE"));
        $(".mpBtnLogout").text(localizeString("LOGOUT"));
        $(".mpDevelopedBy").text(localizeString("DEVELOPED_BY"));            
        $("#logoutModalLabel").text(localizeString("DIALOG_LOGOUT_LABEL"));
        $(".mpLogoutText").text(localizeString("DIALOG_LOGOUT_TEXT"));
        $(".mpLogoutCancel").text(localizeString("CANCEL"));

        // Configure tooltips for collapsed side navigation
        $('.navbar-sidenav [data-toggle="tooltip"]').tooltip({
            template: '<div class="tooltip navbar-sidenav-tooltip" role="tooltip" style="pointer-events: none;"><div class="arrow"></div><div class="tooltip-inner"></div></div>',
            boundary: 'viewport'
        })
  
        // Configure tooltips globally
        $('[data-toggle="tooltip"]').tooltip();

        // Go to currently selected page
        $('.pageLink').each(function () {
            if (window.location.href.indexOf(this.href) > -1) {
                $(this).click();
                $(this).addClass("selected");
            }
        });

        if (message != "")
            showMessage(message);

        if (gotoDeviceInformationPage == true)
            showPageContent("DeviceInformationPage");
    });
}

//-------------------------------------------------------------------------------------
function cleanContainer() {
    $('#mainContainer').empty();
}

//-------------------------------------------------------------------------------------
function showBusyLoader() {
    if ($("#busyLoader")) {
        if (busyLoaderIsOn != null && busyLoaderIsOn == 0) {
            $("#busyLoader").modal("show");
            
            busyLoaderIsOn = 1;
        }
    }
}

//-------------------------------------------------------------------------------------
function hideBusyLoader() {
    if ($("#busyLoader")) {
        if (busyLoaderIsOn != null && busyLoaderIsOn == 1) {
            $("#busyLoader").modal("hide");
            busyLoaderIsOn = 0;
        }
    }
}

//-------------------------------------------------------------------------------------
function showMessage(message, type, timeout = 5000) {
    if ($("#message")) {

        $("#message").removeClass("d-none");
        $("#message").removeClass("alert-primary");
        $("#message").removeClass("alert-secondary");
        $("#message").removeClass("alert-success");
        $("#message").removeClass("alert-danger");
        $("#message").removeClass("alert-warning");
        $("#message").removeClass("alert-info");
        $("#message").removeClass("alert-light");
        $("#message").removeClass("alert-dark");
        $("#message").removeClass("text-dark");

        $("#message").addClass("d-block");
        if (type == undefined || type == "error") {
            $("#message").addClass("alert-danger");
            $("#message").html("<u>" + localizeString("ERRORS") + "</u>: " + localizeString(message));
        } else if (type == "warning") {
            $("#message").addClass("alert-" + type);
            $("#message").addClass("text-dark");
            $("#message").text(localizeString(message));
        } else {
            $("#message").addClass("alert-" + type);
            $("#message").text(localizeString(message));
        }

        if (timerShowMessageId != 0)
            clearTimeout(timerShowMessageId);
    
        timerShowMessageId = setTimeout(hideMessage, timeout);
    }
}

//-------------------------------------------------------------------------------------
function hideMessage() {
    if ($("#message")) {
        $("#message").text("");

        $("#message").removeClass("d-block");
        $("#message").addClass("d-none");

        if (timerShowMessageId != 0)
            clearTimeout(timerShowMessageId);
    }
}

//-------------------------------------------------------------------------------------
function showPageContent(pageName, reloadPage = false) {
    // Show busy loader
    showBusyLoader();

    // Stop polling pumps
    if (timerPumpsPollingId != 0)
        clearTimeout(timerPumpsPollingId);

    // Stop polling probes
    if (timerProbesPollingId != 0)
        clearTimeout(timerProbesPollingId);

    // Stop polling logging
    if (timerLogging != 0)
        clearTimeout(timerLogging);

    // Stop polling tag reader
    if (timerTagReaderPolling != 0)
        clearTimeout(timerTagReaderPolling);

    // Stop polling diagnostics
    if (timerDiagnostics != 0)
        clearTimeout(timerDiagnostics);

    // Remove configuraiton editors
    if ($(".DTED_Lightbox_Background").length > 0) {
        $(".DTED_Lightbox_Background").remove();
    }
    if ($(".DTED_Lightbox_Wrapper").length > 0) {
        $(".DTED_Lightbox_Wrapper").remove();
    }
  
    // Hide tooltip
    $('[data-toggle="tooltip"]').tooltip('hide');

    // Process
    setTimeout(function(){
        // Hide busy loader
        hideBusyLoader();
        
        // Clean container
        cleanContainer();

        // Fill some default elements
        $("#mainContainer").load("pagesPartial/" + pageName + ".html", function(response, status, xhr) {
            if (status == "error") {
                console.error("Error loading page: " + pageName + ".html - Status: " + xhr.status + " " + xhr.statusText);
                $("#mainContainer").html("<div class='alert alert-danger'><strong>Error loading page:</strong> pagesPartial/" + pageName + ".html (HTTP " + xhr.status + ")</div>");
            }
        });

        // Reload page
        if (reloadPage == true)
            window.location = window.location.href.split("#")[0];
    }, 250);
}

//-------------------------------------------------------------------------------------
function ClearAuthentication()
{
    var request = 0;
    var commands = [];
    var IsInternetExplorer = false;

    try {
        var agt = navigator.userAgent.toLowerCase();
        if (agt.indexOf("msie") != -1) { 
            IsInternetExplorer = true; 
        }
    }
    catch(e) {
        IsInternetExplorer = false;    
    };
    
    $("#logoutModal").modal('hide'); 
    
    if (IsInternetExplorer) {
        // Log out Internet Explorer
        document.execCommand("ClearAuthenticationCache");
        
        displayUserInformation(true);
    }
    else {
        $.ajax({
            // This can be any path on your same domain which requires HTTPAuth
            url: "/jsonPTS",
            username: 'logout',
            password: 'logout',
            // If the return is 401, refresh the page to request new details.
            statusCode: { 401: function() {
                    displayUserInformation(true);
                }
            }
        });
    }
}

//-------------------------------------------------------------------------------------
function addZero(i) {
    if (i.toString().length == 1)
        i = "0" + i.toString();
    
    return i;
}

//-------------------------------------------------------------------------------------
// Set cursor position in input field
$.fn.setCursorPosition = function (pos) {
    this.each(function (index, elem) {
        if (elem.setSelectionRange) {
            elem.setSelectionRange(pos, pos);
        } else if (elem.createTextRange) {
            var range = elem.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    });
    return this;
};

//-------------------------------------------------------------------------------------
// Set decimal digits in fields
function fillInputFieldWithDecimalDigits(control, key, totalAllowedDecimalDigits, cursorPosition) {
    var totalAllowesDigits = 9;
    var totalsAllowedIntegerDigits = totalAllowesDigits;
    var totalIntegerDigits = -1;
    var totalDecimalDigits = -1;
    var separatorIndex = -1;
    var separatorCharacter = '.';

    // Limit only numbers and decimal point
    if (isNaN(key) == true &&
        key != separatorCharacter) {
        return;
    }

    // Get number of integer and decimals digits and decimal separator position
    if (control.val().indexOf(".") >= 0) {
        totalIntegerDigits = control.val().split(separatorCharacter)[0].length;
        if (control.val().split(separatorCharacter).length == 2) {
            totalDecimalDigits = control.val().split(separatorCharacter)[1].length;
        }
    } else {
        totalIntegerDigits = control.val().length;
        totalDecimalDigits = 0;
    }

    totalsAllowedIntegerDigits = totalAllowesDigits - totalAllowedDecimalDigits;
    separatorIndex = control.val().indexOf(separatorCharacter);

    if (key == separatorCharacter) {
        // Do not set decimal separator when no decimals are allowed
        if (totalAllowedDecimalDigits == 0) {
            return;
        }

        // Eliminate dublicating dot
        if (control.val().indexOf(separatorCharacter) != -1) {
            return;
        }

        // No digits entered
        if (control.val().length == 0) {
            return;
        }

        // Cursor is on zero position
        if (cursorPosition == 0) {
            return;
        }
    }

    if (cursorPosition == control.val().length) {
        // Already maximal integer digits entered
        if (key != separatorCharacter &&
            separatorIndex == -1 &&
            totalIntegerDigits >= totalsAllowedIntegerDigits) {
            return;
        }

        // Already maximal decimal digits entered
        if (control.val().indexOf(".") >= 0 &&
            totalDecimalDigits >= totalAllowedDecimalDigits) {
            return;
        }

        control.val(control.val() + key);
    } else if (cursorPosition < control.val().indexOf(separatorCharacter)) {
        if (totalIntegerDigits >= totalsAllowedIntegerDigits) {
            control.val(control.val().substring(0, cursorPosition) + key + control.val().substring(cursorPosition + 1));
        } else {
            control.val(control.val().substring(0, cursorPosition) + key + control.val().substring(cursorPosition));
        }
    } else if (cursorPosition > control.val().indexOf(separatorCharacter)) {
        if (totalDecimalDigits >= totalAllowedDecimalDigits) {
            control.val(control.val().substring(0, cursorPosition) + key + control.val().substring(cursorPosition + 1));
        } else {
            control.val(control.val().substring(0, cursorPosition) + key + control.val().substring(cursorPosition));
        }
    } else if (cursorPosition == control.val().indexOf(separatorCharacter)) {
        if (totalIntegerDigits >= totalsAllowedIntegerDigits) {
            return;
        } else {
            control.val(control.val().substring(0, cursorPosition) + key + control.val().substring(cursorPosition));
        }
    }
    
    control.setCursorPosition(cursorPosition + 1);
}

//-------------------------------------------------------------------------------------
function compare(a, b) {
    // Use toUpperCase() to ignore character casing
    const fileNameA = a.Name.toUpperCase();
    const fileNameB = b.Name.toUpperCase();

    var comparison = 0;
    if (fileNameA > fileNameB)
        comparison = 1;
    else if (fileNameA < fileNameB)
        comparison = -1;

    return comparison;
}

//-------------------------------------------------------------------------------------
function setCookie(cname, cvalue, exdays = null) {
    var d = new Date();
    var expires = "expires=Fri, 31 Dec 9999 23:59:59 GMT";

    if (exdays != null) {
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        expires = "expires="+ d.toUTCString();
    }   
    
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

//-------------------------------------------------------------------------------------
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');

    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];

        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }

        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

//-------------------------------------------------------------------------------------
function viewport() {
    var e = window, a = 'inner';
    if (!('innerWidth' in window )) {
        a = 'client';
        e = document.documentElement || document.body;
    }

    return { width : e[ a+'Width' ] , height : e[ a+'Height' ] };
}

//-------------------------------------------------------------------------------------