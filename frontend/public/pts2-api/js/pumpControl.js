class Pump {
    constructor(Id, Status) {
        this._id = Id;
        this._statusName = localizeString("OFFLINE").toUpperCase();
        this._status = Status;
        this._transaction = 0;
        this._nozzle = 0;
        this._volume = "0";
        this._amount = "0";
        this._volumeTotal = "0";
        this._amountTotal = "0";
        this._price = "0";
        this._request = "";
        this._tag = "";
        this._user = "";
        this._orderVolume = 0;
        this._orderAmount = 0;

        // Nozzle grades
        this._grades = [{ name: "", price: 0 }, 
                        { name: "", price: 0 }, 
                        { name: "", price: 0 }, 
                        { name: "", price: 0 }, 
                        { name: "", price: 0 }, 
                        { name: "", price: 0 }];
    }

    get Id() {
        return this._id;
    }
    set Id(id) {
        this._id = id;
    }

    get Status() {
        return this._status;
    }
    set Status(status) {
        this._status = status;
    }

    get StatusName() {
        return this._statusName;
    }
    set StatusName(statusName) {
        this._statusName = statusName;
    }

    get Transaction() {
        return this._transaction;
    }
    set Transaction(transaction) {
        this._transaction = transaction;
    }

    get Nozzle() {
        return this._nozzle;
    }
    set Nozzle(nozzle) {
        this._nozzle = nozzle;
    }

    get Volume() {
        return this._volume;
    }
    set Volume(volume) {
        this._volume = volume;
    }

    get Amount() {
        return this._amount;
    }
    set Amount(amount) {
        this._amount = amount;
    }

    get VolumeTotal() {
        return this._volumeTotal;
    }
    set VolumeTotal(volumeTotal) {
        this._volumeTotal = volumeTotal;
    }

    get AmountTotal() {
        return this._amountTotal;
    }
    set AmountTotal(amountTotal) {
        this._amountTotal = amountTotal;
    }

    get Price() {
        return this._price;
    }
    set Price(price) {
        this._price = price;
    }

    get Request() {
        return this._request;
    }
    set Request(request) {
        this._request = request;
    }

    get Tag() {
        return this._tag;
    }
    set Tag(tag) {
        this._tag = tag;
    }

    get User() {
        return this._user;
    }
    set User(user) {
        this._user = user;
    }

    get OrderVolume() {
        return this._orderVolume;
    }
    set OrderVolume(orderDose) {
        this._orderVolume = orderDose;
    }

    get OrderAmount() {
        return this._orderAmount;
    }
    set OrderAmount(orderDose) {
        this._orderAmount = orderDose;
    }

    // Get grade data
    static GetGradeData(pump, nozzleNumber) {
        return pump._grades[nozzleNumber - 1];
    }

    // Set grade data
    static SetGradeData(pump, nozzleNumber, gradeName, price) {
        pump._grades[nozzleNumber - 1].name = gradeName;
        pump._grades[nozzleNumber - 1].price = price;
    }

    // Set grade price
    static SetGradePrice(pump, nozzleNumber, price) {
        pump._grades[nozzleNumber - 1].price = price;
    }

    // Draw pump
    static Draw(pump) {
        if ($("#pcpPumps").length > 0) {
            $("#pcpPumps").append($(".pcpPumpControlTemplate").clone().removeClass('pcpPumpControlTemplate').removeClass('d-none').attr("id", "pcpPump" + pump._id.toString()));
        }
    }

    // Update pump widget
    static UpdateWidget(pump) {
        if (pump == undefined || pump == null) {
            return;
        }

        if ($("#pcpPump" + pump._id).length > 0) {
            // Pump number
            $("#pcpPump" + pump._id + " .pcpPumpNumber").text(pump._id);

            // Status
            if (pump._status == "IDLE") {
                $("#pcpPump" + pump._id + " .pcpPumpStatus").text(localizeString("IDLE").toUpperCase());
                $("#pcpPump" + pump._id + " .card-title").attr('class', 'card-title border-bottom border-secondary text-center font-weight-bold m-0 pumpIdleStatus');
            } else if (pump._status == "NOZZLE") {
                $("#pcpPump" + pump._id + " .pcpPumpStatus").text(localizeString("NOZZLE").toUpperCase());
                $("#pcpPump" + pump._id + " .card-title").attr('class', 'card-title border-bottom border-secondary text-center font-weight-bold m-0 pumpIdleNozzleUpStatus');
            } else if (pump._status == "FILLING") {
                $("#pcpPump" + pump._id + " .pcpPumpStatus").text(localizeString("FILLING").toUpperCase());
                $("#pcpPump" + pump._id + " .card-title").attr('class', 'card-title border-bottom border-secondary text-center font-weight-bold m-0 pumpFillingStatus');
            } else if (pump._status == "OFFLINE") {
                $("#pcpPump" + pump._id + " .pcpPumpStatus").text(localizeString("OFFLINE").toUpperCase());
                $("#pcpPump" + pump._id + " .card-title").attr('class', 'card-title border-bottom border-secondary text-center font-weight-bold m-0 pumpOfflineStatus');
            } else if (pump._status == "NO CONNECTION") {
                $("#pcpPump" + pump._id + " .pcpPumpStatus").text(localizeString("NO_CONNECTION").toUpperCase());
                $("#pcpPump" + pump._id + " .card-title").attr('class', 'card-title border-bottom border-secondary text-center font-weight-bold m-0 pumpNoConnectionStatus');
            }

            // User
            $("#pcpPump" + pump._id + " .pcpPumpUser").text(pump._user);

            // Amount
            $("#pcpPump" + pump._id + " .pcpPumpAmount").val(pump._amount);

            // Volume
            $("#pcpPump" + pump._id + " .pcpPumpVolume").val(pump._volume);

            // Price
            $("#pcpPump" + pump._id + " .pcpPumpPrice").val(pump._price);
        }
    }

    // Update pump in datatable
    static UpdateDatatable(datatable, pump) {
        if (datatable == undefined || datatable == null ||
            pump == undefined || pump == null) {
            return;
        }

        datatable.rows().eq(PUMP_NUMBER_INDEX).each(function(rowIndex) {
            if (parseInt(datatable.cell(rowIndex, PUMP_NUMBER_INDEX).data(), 10) == parseInt(pump._id, 10)) {

                switch(pump._status) {
                    case "IDLE":
                        datatable.cell(rowIndex, PUMP_STATUS_INDEX).data(pump._statusName);
                        break;
                        
                    case "NOZZLE":
                        datatable.cell(rowIndex, PUMP_STATUS_INDEX).data(pump._statusName);
                        break;
                        
                    case "FILLING":
                        datatable.cell(rowIndex, PUMP_STATUS_INDEX).data(pump._statusName);
                        break;
                        
                    case "OFFLINE":
                        datatable.cell(rowIndex, PUMP_STATUS_INDEX).data(pump._statusName);
                        break;
                        
                    case "NO CONNECTION":
                        datatable.cell(rowIndex, PUMP_STATUS_INDEX).data(pump._statusName);
                        break;                
                }
                
                if (parseInt(pump._nozzle, 10) > 0 &&
                    pump._nozzle.toString().includes(" ") == false &&
                    pump._grades[parseInt(pump._nozzle, 10) - 1].name.length > 0) {
                    pump._nozzle = pump._nozzle + " (" + pump._grades[parseInt(pump._nozzle, 10) - 1].name + ")";
                }
                
                datatable.cell(rowIndex, PUMP_NOZZLE_INDEX).data(pump._nozzle);
                datatable.cell(rowIndex, PUMP_VOLUME_FILLED_INDEX).data(parseFloat(pump._volume).toFixed(SYSTEM_VOLUME_DECIMAL_DIGITS));
                datatable.cell(rowIndex, PUMP_AMOUNT_FILLED_INDEX).data(parseFloat(pump._amount).toFixed(SYSTEM_AMOUNT_DECIMAL_DIGITS));
                datatable.cell(rowIndex, PUMP_VOLUME_TOTAL_INDEX).data(parseFloat(pump._volumeTotal).toFixed(SYSTEM_VOLUME_TOTAL_DECIMAL_DIGITS));
                datatable.cell(rowIndex, PUMP_AMOUNT_TOTAL_INDEX).data(parseFloat(pump._amountTotal).toFixed(SYSTEM_AMOUNT_TOTAL_DECIMAL_DIGITS));
                datatable.cell(rowIndex, PUMP_PRICE_INDEX).data(parseFloat(pump._price).toFixed(SYSTEM_PRICE_DECIMAL_DIGITS));
                datatable.cell(rowIndex, PUMP_USER_INDEX).data(pump._user);
                datatable.cell(rowIndex, PUMP_REQUEST_INDEX).data(pump._request);

                // Refresh datatable
                datatable.row(rowIndex).invalidate().draw();

                return;
            }
        });
    }

    // Close transaction
    static CloseTransaction(pump) {
        // Close transaction
        commands = [];
        commands.push({
            function: PumpCloseTransaction,
            arguments: [
                pump.Id, 
                pump.Transaction
            ]
        });
        request = createComplexRequest(commands, false);
    }
}