import React, { ReactNode, useEffect, useState,useRef } from 'react';
import { SPHttpClient } from '@microsoft/sp-http'
import { Avatar, Card, CardContent, InputBase, Typography } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import useWindowDimensions from '../utils/useWindowDimensions';
import { Autocomplete, Pagination } from '@material-ui/lab';
import TruncatedText from "./TruncatedText"
import { Box, Chip, Collapse, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Select, Switch, TextField } from '@material-ui/core';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import equal from "fast-deep-equal";
import makeNestedObject from './nestedObject';
import GroupData from './GroupData';
import Menu from '@material-ui/core/Menu';
import MoreVertIcon from '@material-ui/icons/MoreVert'
import ReactToPrint from 'react-to-print';
import { Web } from "sp-pnp-js";
import exportFromJSON from 'export-from-json';
import DoneIcon from '@material-ui/icons/Done';
import ClearIcon from '@material-ui/icons/Clear';
import BrokenImageIcon from '@material-ui/icons/BrokenImage';
import FilterListIcon from '@material-ui/icons/FilterList';
import moment from 'moment';
const { jsPDF } = require('jspdf');
let isImageUrl:any = require("is-image-url");
require('jspdf-autotable');

const renderMethods = {
    "DATE": (value) => value ? moment(value).format("MM/DD/YYYY hh:mm:ss a") : undefined,
    "CURRENCY": (value) => value ? <span style={{ color: "#009BE5" }}>${value} </span> : undefined,
    "USER": (value) => value ? <Chip avatar={<Avatar>{value.toString()[0]}</Avatar>} size="small" label={value} /> : "",
    "TRUNCATED-TEXT": (value) => value ? 
                                isImageUrl(value) ? 
                                    <Avatar src={value} /> 
                                    : typeof value === "string" && value.length > 40 ? 
                                        <TruncatedText text={value} /> 
                                        : value
                                : undefined,
    "NORMAL": (value) => value ? isImageUrl(value) ? <Avatar src={value} /> : typeof value === "string" && value.length > 40 ? <TruncatedText text={value} /> : value : undefined,
    "IMAGE": (value) => value  ? <Avatar src={value} style={{margin:"0 auto",textAlign:"center"}} /> 
                                : <Avatar> <BrokenImageIcon/> </Avatar>,
    "BOOLEAN":(value) => value ? <DoneIcon /> : <ClearIcon />,
    "URL": (value) => isImageUrl(value) ? <Avatar src={value} style={{margin:"0 auto",textAlign:"center"}} /> : <a href={value} target="_blank" >Link</a>
}

interface Column {
    id: string;
    label: string;
    secondParameter?:any,
    render?:(value: string | number,secondParameter?:any) => ReactNode,
}

const searchByColumn = (rows:any, searchObject:any) => {
    let columnsToSearch = Object.keys(searchObject).filter(
        (value) => !!searchObject[value].trim()
    );
    return rows.filter((row:any) =>
        columnsToSearch.every((column) => {
            let regex = new RegExp(
                searchObject[column].toString().split("\\").join(""),
                "gi"
            );
            return row[column] ? row[column].toString().match(regex) : false;
        })
    );
};


function Row(props: { row: any, columns: Column[], expandAll: boolean,index:number,rowsPerPage:number,page:number }) {
    const { row,columns,expandAll,index,rowsPerPage,page } = props;
    const [open, setOpen] = React.useState(false);
    const { width } = useWindowDimensions();

    useEffect(() => {
        setOpen(expandAll)
    }, [expandAll])

    return (
        <React.Fragment>
            <TableRow hover role="checkbox" tabIndex={-1}>
                <TableCell
                    style={{
                        border: "1px solid #dddddd",
                        width:"40px"
                    }}  
                >
                    {
                        columns.length*250 > width ? (
                            <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                                {open ? <ArrowDropDownIcon /> : <ArrowRightIcon />}
                            </IconButton>
                        ) : ((page-1)*rowsPerPage + (index+1))
                    }
                </TableCell>
                {columns.map((column,i) => {
                    const value = row[column.id];
                    return (
                        (i+1)*250 < width ?
                        <TableCell key={column.id} align={"center"}
                            style={{
                                border: "1px solid #dddddd",
                            }}
                        >
                            {
                                    !!column.render ? column.render(value, column.secondParameter ? column.secondParameter : undefined) : value
                            }
                        </TableCell> : ""
                    );
                })}
            </TableRow>
            <TableCell style={{ paddingBottom: 0, paddingTop: 0, }} colSpan={width > 400 ? 3 : 2 }>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box>
                        <Table size="small" aria-label="purchases" >                 
                            <TableBody>
                                    {columns.map((column,i) => {
                                        const value = row[column.id];
                                        return (
                                            (i+1)*250 >= width ? (
                                                <TableRow key={column.id} >
                                                    <TableCell>
                                                        {column.label}
                                                    </TableCell>
                                                    <TableCell align={"left"}>
                                                        {
                                                            !!column.render ? column.render(value, column.secondParameter ? column.secondParameter : undefined) : typeof value === "string" && value.length > 40 ? <TruncatedText text={value} /> : value
                                                        }
                                                    </TableCell>
                                                </TableRow>
                                            ) : ""
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </Box>
                </Collapse>
            </TableCell>
        </React.Fragment>
    );
}

const doesSearchValueExists = (row:any, searchValue:string) => {
    let rowItems = Object.values(row).map(item => item.toString());
    const regex = new RegExp(searchValue.toString(), 'gi')
    return rowItems.some(e => !!(typeof e === "string" && e.match(regex)))       
}

const splitByInterval = (stringToSplit, length) => {
    let stringLength = stringToSplit.length
    var splittedString = ""
    let index = 0
    while (index <= stringLength) {
        splittedString += `${stringToSplit.substr(index, length)} `
        index += length
    }
    return splittedString
}

const getArrayFromGroupedData = (rows,index,columns) => {
    if(Array.isArray(rows)){
        return [...rows.map(row => {
            let arrToReturn = []
            columns.forEach((head,i) => {
                if(!(i < index)){
                    let data = row[head.id] ? row[head.id] : ""
                    let spacing = data.toString().split(" ").length
                    if (head.type === "DATE") {
                        arrToReturn.push(row[head.id] ? moment(row[head.id]).format("MM/DD/YYYY hh:mm:ss a") : "")
                    } else if (data.toString().length > 20 && spacing < 3) {
                        arrToReturn.push(splitByInterval(data.toString(), 15))
                    } else {
                        arrToReturn.push(row[head.id])
                    }
                } else {
                    arrToReturn.push("")
                }
            })
            return arrToReturn
        }),[]]
    }else {
        let arrToReturn = []
        Object.keys(rows).forEach(row =>{
            console.log(row);
            let newArr = []
            newArr[index] = row 
            arrToReturn = [...arrToReturn,newArr,...getArrayFromGroupedData(rows[row],index+1,columns)]
        })
        return arrToReturn
    }
}


const getRowsForPdf = (rows,isGroupingEnabled:boolean,columns) => {
    if(!isGroupingEnabled){
        return rows.map(row => {
            let arrToReturn = []
            columns.forEach(head => {
                let data = row[head.id] ? row[head.id] : ""
                let spacing = data.toString().split(" ").length
                if (head.type === "DATE"){
                    arrToReturn.push(row[head.id] ? moment(row[head.id]).format("MM/DD/YYYY hh:mm:ss a") : "")
                }
                else if (data.toString().length > 20 && spacing < 3) {
                    arrToReturn.push(splitByInterval(data.toString(), 15))
                } else {
                    arrToReturn.push(row[head.id])
                }
            })
            return arrToReturn
        })
    } else {
        return [...getArrayFromGroupedData(rows,0,columns)]
    }
}

export default function GroupByTable(props:any) {
    const { 
        isGroupingEnabled: isDisplayGroupingEnabled, 
        isColumnSearchEnabled, 
        list, 
        selectedExportFunctionalities, 
        selectedColumns, 
        listColumnsWithType,
        isPagingEnabled,
        headerBackgroundColor,
        headerTextColor,
        pagingPosition,
        heading
    } = props
    const [rows, setRows] = useState<any[]>([]);
    const [unfilteredRows, setUnfilteredRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<Column[]>([])
    const [rowsAfterFiltered, setRowsAfterFiltered] = useState<any[]>([]);
    const [rowsAfterGrouped, setRowsAfterGrouped] = useState<any[]>([]);
    const [columnsForMapping, setColumnsForMapping] = useState<Column[]>([]);
    const [groupByHeaders, setGroupByHeaders] = useState<Column[]>([]);
    const [isGroupingEnabled, setIsGroupingEnabled] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(50);
    const [expandAll, setExpandAll] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [searchObject, setSearchObject] = useState<any>({});
    const tableRef = useRef(null)
    const { width } = useWindowDimensions();
    const [displaySearchFields, setDisplaySearchFields] = useState(true);
    const [users, setUsers] = useState({});

    const exportPDF = (rows: any[]) => {
        if (jsPDF !== null) {
            let content = {
                startY: 20,
                theme:"grid",
                head: [isGroupingEnabled ? columnsForMapping.map(column => column.label) : columns.map(column => column.label)],
                body: getRowsForPdf(rows, isGroupingEnabled,isGroupingEnabled ? columnsForMapping : columns),
                createdCell:(cell) => {
                    console.log(cell);
                    console.log(cell.row.raw);
                    if(!cell.row.raw.length){
                        cell.cell.styles.fillColor = [191, 181, 179];
                    }
                }
            }
            const doc = new jsPDF("landscape", "pt", "A4");
            doc.setFontSize(15);
            doc.text("Data-table", 40, 40);
            doc.autoTable(content);
            doc.save("Data-table.pdf");
        } else {
            console.log("hell yaaa!");
        }
    }

    const handleRowsPerPageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setRowsPerPage(event.target.value as number);
        setPage(1)
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const getUsers = async () => {
        try {
            let data = await props.context.spHttpClient.get(props.context.pageContext.web.absoluteUrl + "/_api/web/siteusers", SPHttpClient.configurations.v1)
            return data.json()            
        } catch (error) {
            console.log(error);
            return error
        }
    }

    useEffect(() => {
        getUsers().then(data => {
            if(data && data.value){
                let json = {}
                data.value.forEach(item => { 
                    json[item.Id] = item.Title
                 })
                 setUsers(json)
            }else {
                console.log(data);
            }
        })
    },[])

    useEffect(() => {
        let web = new Web(props.context.pageContext.web.absoluteUrl);
        web.lists.getById(list).items.get().then(data => {
            setUnfilteredRows(data);
        }).catch(err => {
            console.log(err);
        })
    }, [list])

    useEffect(() => {
        setRows((prev) => {
            return unfilteredRows.map((row,i) => {
                let objectToReturn = {}
                selectedColumns.forEach(column => {
                    let index = listColumnsWithType.findIndex((listColumn) => {
                        return listColumn.id === column
                    })
                    if (listColumnsWithType[index] && listColumnsWithType[index].type === "USER"){
                        objectToReturn[column] = users[row[column+"StringId"]]
                    }
                    else if (listColumnsWithType[index] && listColumnsWithType[index].type === "IMAGE") {
                        let image = JSON.parse(row[column])
                        objectToReturn[column] = !!image ? (image.serverUrl + image.serverRelativeUrl) : ""
                    }
                    else if (listColumnsWithType[index] && listColumnsWithType[index].type === "URL") {
                        objectToReturn[column] = row[column].Url
                    }
                    else if (!!row[column]) {
                        objectToReturn[column] = row[column].toString()
                    }
                });
                return objectToReturn
            })
        })
        setColumns(prev => {
            let finalColumnsArr = []
            if (listColumnsWithType) {
                listColumnsWithType.forEach((column) => {
                    if (selectedColumns.includes(column.id)) {
                        finalColumnsArr.push({
                            ...column,
                            render: renderMethods[column.type]
                        })
                    }
                })
            }
            return finalColumnsArr
        })
    }, [unfilteredRows,users,selectedColumns,listColumnsWithType])

    useEffect(() => {
        setPage(1)
        if (Object.values(searchObject).some(value => typeof value === "string" && !!value.trim())) {
            let tempFilteredRows: any[] = searchByColumn(rows, searchObject)
            setRowsAfterFiltered(tempFilteredRows);
        } else {
            setRowsAfterFiltered(rows)
        }
    }, [searchObject, rows, rowsPerPage])

    useEffect(() => {
        if(isGroupingEnabled){
            setRowsAfterGrouped(makeNestedObject(groupByHeaders.map(column => column.id), 0, rowsAfterFiltered.slice((page - 1) * rowsPerPage, page * rowsPerPage)));
        }
    }, [isGroupingEnabled,groupByHeaders,rowsAfterFiltered,page,rowsPerPage])

    useEffect(() => {
        if(groupByHeaders.length){
            setIsGroupingEnabled(true)
            let newColumns = [...groupByHeaders];
            columns.forEach(column=> {
                let isAlreadyIncluded = false
                for(let selectedColumn of newColumns){
                    if(equal(column,selectedColumn)){
                        isAlreadyIncluded = true
                        break
                    }
                }
                if(!isAlreadyIncluded){
                    newColumns.push(column)
                }
            })
            setColumnsForMapping(newColumns);
        } else {
        setIsGroupingEnabled(false)
        setColumnsForMapping(columns);
        }
    }, [groupByHeaders,columns])

    if(!list){
        return (
            <Card
                style={{
                    minWidth:300,
                    margin:"20px auto"
                }}
            >
                <CardContent>
                    <Typography style={{
                        textAlign:"center"
                    }}  variant="h5" component="h2">
                        Please Select a list from the Property Pane
                    </Typography>
                </CardContent>
            </Card>
        )
    }

    if(!selectedColumns || selectedColumns.length < 2){
        return (
            <Card
                style={{
                    minWidth: 300,
                    margin: "20px auto"
                }}
            >
                <CardContent>
                    <Typography style={{
                        textAlign: "center"
                    }} variant="h5" component="h2">
                        Please Select atleast 2 Columns from the Property Pane
                    </Typography>
                </CardContent>
            </Card>
        )
    }

    return (
            <Paper>
                <Typography
                    variant="h4"
                    component="h1"
                    align="center"
                >
                    {
                        heading
                    }
                </Typography>
                {
                    isDisplayGroupingEnabled ? (
                    <div style={{ padding: "20px", display: "flex", flexDirection: width < 700 ? "column" : "row" }}>
                        <Autocomplete
                            multiple
                            id="headers-autocomplete"
                            style={{
                                width: "100%",
                            }}
                            value={groupByHeaders}
                            onChange={(e, v: Column[]) => {
                                setGroupByHeaders(v);
                            }}
                            limitTags={3}
                            options={columns}
                            getOptionLabel={(option: Column) => option.label}
                            filterSelectedOptions
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="outlined"
                                    label="Group By Headers"
                                    placeholder="Select Header"
                                />
                            )}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip
                                        variant="outlined"
                                        color="primary"
                                        label={option.label}
                                        {...getTagProps({ index })}
                                    />
                                ))
                            }
                        />
                    </div>
                    ) : ""
                }
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                    }}
                >
                    <div
                        style={{ width: "120px", margin: "20px" }}
                    >
                        <FormControl variant="outlined" style={{ width: "120px" }}>
                            <InputLabel id="Rows-Per-Page-Select-label" >Display</InputLabel>
                            <Select
                                labelId="Rows-Per-Page-Select-label"
                                id="rows-per-page-select"
                                label="Display"
                                value={rowsPerPage}
                                onChange={handleRowsPerPageChange}
                                fullWidth
                                margin="dense"
                            >
                                <MenuItem value={10}>10 Rows</MenuItem>
                                <MenuItem value={20}>20 Rows</MenuItem>
                                <MenuItem value={50}>50 Rows</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControlLabel
                        control={<Switch checked={expandAll} id="switch-to-expand" inputProps={{ 'aria-label': 'expand',role:"switch" }} onKeyUp={(e) => {
                            if (e.keyCode === 13) {
                                e.preventDefault();
                                document.getElementById("switch-to-expand").click();
                            }
                        }} onChange={() => setExpandAll(prev => !prev)} />}
                            label="Expand"
                        />
                    </div>
                    {
                    selectedExportFunctionalities.length ? (
                        <>
                    <IconButton
                        aria-label="more"
                        aria-controls="long-menu"
                        aria-haspopup="true"
                        onClick={handleMenuClick}
                    >
                        <MoreVertIcon />
                    </IconButton>
                    <Menu
                        id="long-menu"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={() => setAnchorEl(null)}
                    >
                    {
                        selectedExportFunctionalities.includes("PDF") ? (
                            <MenuItem
                                onClick={() => {
                                                exportPDF(isGroupingEnabled ? rowsAfterGrouped : rowsAfterFiltered.slice((page - 1) * rowsPerPage, page * rowsPerPage));
                                }}
                            >
                                Export PDF
                            </MenuItem>
                        ) : ""
                    }
                    {
                        selectedExportFunctionalities.includes("Excel") ? (
                            <MenuItem
                                onClick={() => exportFromJSON({ data: rowsAfterFiltered, fileName: "export-excel", exportType: exportFromJSON.types.xls })}
                            >
                                Export Excel
                            </MenuItem>
                        ) : ""
                    }
                    {
                        selectedExportFunctionalities.includes("CSV") ? (
                            <MenuItem
                                onClick={() => exportFromJSON({ data: rowsAfterFiltered, fileName: "export-csv", exportType: exportFromJSON.types.csv })}
                            >
                                Export CSV
                            </MenuItem>
                        ) : ""
                    }
                    {
                    selectedExportFunctionalities.includes("Print") ? (
                        <ReactToPrint
                            trigger={() => {
                                return (
                                    <MenuItem
                                    >
                                        Print Page
                                    </MenuItem>
                                );
                            }}
                            content={() => tableRef.current}
                            pageStyle={"padding:20px"}
                            onBeforeGetContent={() => {
                                setDisplaySearchFields(false)
                                setTimeout(() => {
                                    setDisplaySearchFields(true)
                                }, 1000);
                            }}
                        />
                    ) : ""
                    }
                    </Menu>
                    </>
                    ) : ""
                    }
                </div>
                {
                isPagingEnabled && pagingPosition && pagingPosition.startsWith("top") ? (
                    <div
                        style={{
                            display:"flex",
                            flexDirection: "row",
                            justifyContent:pagingPosition === "top-left" ? "flex-start" :"flex-end",
                        }}
                    >
                        <Pagination
                            style={{
                                padding: "10px",
                            }}
                            page={page}
                            count={Math.ceil((rowsAfterFiltered.length) / rowsPerPage)}
                            onChange={(e, p) => setPage(p)}
                            variant="text"
                            color="primary"
                            shape="rounded"
                            siblingCount={1}
                            size={"small"}
                        />
                    </div>
                    ) : ""
                }  
                <TableContainer >
                <Table aria-label="Data table" ref={tableRef} style={{ borderCollapse:"collapse",tableLayout: "fixed" }} >
                        <TableHead style={{
                        border: "1px solid #dddddd",
                        backgroundColor:headerBackgroundColor || "#fff"
                        }} >
                            <TableRow >
                                <TableCell
                                    align={"left"}
                                    className="fixedWidth"
                                    style={{
                                        border: "1px solid #dddddd",
                                        width:isGroupingEnabled ? groupByHeaders.length * 5 : "20px"
                                    }}
                                >
                                    #
                                </TableCell>
                                {columnsForMapping.map((column, i) => (
                                    <>
                                        {
                                            (i + 1) * 250 < width || isGroupingEnabled ? (
                                                <>
                                                <TableCell
                                                    key={column.id}
                                                    align={"center"}
                                                    style={{
                                                        border: "1px solid #dddddd",
                                                        width: isGroupingEnabled ? "100px" : undefined,
                                                        color:headerTextColor || "#000"
                                                    }}
                                                >
                                                    {column.label}
                                                </TableCell>
                                                </>
                                            ) : ""
                                        }

                                    </>
                                ))}
                                {
                                    isGroupingEnabled ? (
                                    <TableCell
                                        align={"left"}
                                        className="fixedWidth"
                                        style={{
                                            border: "1px solid #dddddd",
                                            width: isGroupingEnabled ? groupByHeaders.length * 5 : "20px"
                                        }}
                                    >
                                        #
                                    </TableCell>
                                    ) : ""
                                }
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <>
                            {
                                displaySearchFields && isColumnSearchEnabled ? (
                                    <TableRow>
                                        <TableCell>
                                            {" "}
                                        </TableCell>
                                        {
                                            columnsForMapping.map((column, i) => (
                                                <>
                                                {
                                                        (i + 1) * 250 < width || isGroupingEnabled ? (
                                                            <TableCell
                                                                style={{
                                                                    border: "1px solid #dddddd",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        justifyContent: "center",
                                                                        flexDirection: "row"
                                                                    }}
                                                                >
                                                                    <FilterListIcon />
                                                                    <InputBase style={{
                                                                        border: "2px solid #dddddd",
                                                                        borderRadius: "5px"
                                                                    }} margin="dense" value={searchObject[column.id]} onChange={(e) => {
                                                                        e.persist();
                                                                        if (e.target && e.target.value) {
                                                                            setSearchObject((prev: any) => ({ ...prev, [column.id]: e.target.value }))
                                                                        } else {
                                                                            setSearchObject((prev: any) => ({ ...prev, [column.id]: "" }))
                                                                        }
                                                                    }}
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                        ) : ""
                                                }
                                                </>
                                            ))
                                        }
                                    </TableRow>
                                ) : ""
                            }
                                {
                                    !isGroupingEnabled ? (
                                        <>
                                            {
                                                rowsAfterFiltered.slice((page - 1) * rowsPerPage, page * rowsPerPage).map(
                                                    (row, i) =>
                                                        <Row row={row} key={i} index={i} columns={columnsForMapping} expandAll={expandAll} rowsPerPage={rowsPerPage} page={page} />
                                                )
                                            }
                                        </>
                                    ) : (
                                        <TableCell  colSpan={columns.length + 2} >
                                                <GroupData data={rowsAfterGrouped} columns={columnsForMapping} index={0} isExpandAllEnabled={expandAll} />
                                            </TableCell>
                                        )
                                }
                            </>
                        </TableBody>
                    </Table>
                </TableContainer>
            {
                isPagingEnabled && pagingPosition && pagingPosition.startsWith("bottom") ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection:"row",
                            justifyContent: pagingPosition === "bottom-left" ? "flex-start" : "flex-end",
                        }}
                    >
                        <Pagination
                            style={{
                                padding: "10px",
                            }}
                            page={page}
                            count={Math.ceil((rowsAfterFiltered.length) / rowsPerPage)}
                            onChange={(e, p) => setPage(p)}
                            variant="text"
                            color="primary"
                            shape="rounded"
                            siblingCount={1}
                            size={"small"}
                        />
                    </div>
                ) : ""
            }
            </Paper>
    );
}
