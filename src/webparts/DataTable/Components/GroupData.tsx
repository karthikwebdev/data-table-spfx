import React, { useEffect, useState } from 'react'
import { Accordion, AccordionDetails, AccordionSummary, Collapse, IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';


interface Props {
    data:any,
    columns:any,
    index:number,
    isExpandAllEnabled:boolean
}

interface RenderAccordianProps{
    isExpandAllEnabled: boolean,
    item:string,
    columns:any,
    index:number,
    data:any
}

const RenderAccordian = (props:RenderAccordianProps) => {
    const { isExpandAllEnabled,item,columns,index,data } = props
    const [openAccordian, setOpenAccordian] = useState<boolean>(false);

    useEffect(() => {
        setOpenAccordian(isExpandAllEnabled)
    }, [isExpandAllEnabled])

    return (
        <>
            {/* <Accordion expanded={openAccordian} onChange={() => setOpenAccordian(prev => !prev)} >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={`Panel-header-${item}`}
                    id={"panel-header" + item}
                >
                    <Typography ><span style={{ color: "#009be5", fontWeight: 900 }} > {columns[index].label}: </span> {"  "}{!!columns[index].render ? columns[index].render(item, columns[index].secondParameter) : item}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <div
                        style={{
                            width: "100%"
                        }}
                    >
                        <GroupData data={data[item]} columns={columns} index={index + 1} isExpandAllEnabled={isExpandAllEnabled} />
                    </div>
                </AccordionDetails>
            </Accordion> */}
            <div
                style={{
                    boxSizing:"border-box",
                    border: "2px solid #aaaaaa",
                    width:"99%",
                    margin:"10px 0",
                    backgroundColor: "#EDEDED",
                    overflow:"hidden"
                }}
            >
                <div
                    style={{
                        width: "100%",
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignItems: "left",
                        boxSizing: "border-box",
                    }}
                >
                    <IconButton size="small"
                        style={{
                            margin:"5px"
                        }}
                    onClick={() => setOpenAccordian(prev => !prev)} >
                        {!openAccordian ? (
                            <ArrowRightIcon />
                        ) : (
                                <ArrowDropDownIcon />
                            )}
                    </IconButton>
                    <Typography 
                        style={{
                            margin: "5px"
                        }}
                    ><span style={{ color: "#009be5", fontWeight: 900 }} > {columns[index].label}: </span> {"  "}{!!columns[index].render ? columns[index].render(item, columns[index].secondParameter) : item}</Typography>

                </div>
                <Collapse in={openAccordian} component="div" >
                    <div
                        style={{
                            width: "100%",
                            margin: "10px",
                            boxSizing: "border-box"
                        }}
                    >
                        <GroupData data={data[item]} columns={columns} index={index + 1} isExpandAllEnabled={isExpandAllEnabled} />
                    </div>
                </Collapse>
            </div>
        </>
    )
}

function GroupData( props:Props ) {
    const { data, columns, index, isExpandAllEnabled }  = props

    if(Array.isArray(data)){
        return (
            <Table size="small" aria-label="a dense table" style={{tableLayout:"fixed",backgroundColor:"white"}} >
                <TableHead>
                    <TableRow>
                        {
                             columns.map((column:any) => {
                                return (
                                    <TableCell
                                        align="center"
                                    > { column.label } </TableCell>
                                )
                            })
                        }
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.orderId}>
                            {
                                columns.map((column:any) => (
                                    <TableCell align="center" component="th" scope="row">
                                        {!!column.render ? column.render(row[column["id"]], column.secondParameter) : row[column["id"]]}
                                    </TableCell>
                                ))
                            }                            
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            )
    }
    return (
        <>
            {
                Object.keys(data).map(key => 
                      <RenderAccordian key={key} item={key} columns={columns} index={index} data={data} isExpandAllEnabled={isExpandAllEnabled} />
                )
            }
        </>
    )
}

export default GroupData
