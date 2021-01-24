import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  IPropertyPaneDropdownOption,
  PropertyPaneToggle,
  PropertyPaneDropdown,
} from '@microsoft/sp-property-pane';
import { Web } from "sp-pnp-js";
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { PropertyFieldColorPicker, PropertyFieldColorPickerStyle } from '@pnp/spfx-property-controls/lib/PropertyFieldColorPicker';
import { PropertyFieldMultiSelect } from '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect';
import { PropertyFieldListPicker, PropertyFieldListPickerOrderBy } from '@pnp/spfx-property-controls/lib/PropertyFieldListPicker';
import moment from 'moment';
import * as strings from 'ListItemsHooksWebPartStrings';
import DataTable from './Components/DataTable';

export interface IListItemsHooksWebPartProps {
  list: string;
  isGroupingEnabled:boolean;
  isColumnSearchEnabled:boolean;
  isPagingEnabled:boolean;
  name:string;
  selectedExportFunctionalities: string[];
  selectedColumns: string[];
  listColumnsWithType:any[];
  headerBackgroundColor:string;
  headerTextColor:string;
  pagingPosition:string;
}

export default class ListItemsHooksWebPart extends BaseClientSideWebPart<IListItemsHooksWebPartProps> {
  private listColumns: IPropertyPaneDropdownOption[];
  public render(): void {
    const element: React.ReactElement = React.createElement(
      DataTable,
      {
        isGroupingEnabled:this.properties.isGroupingEnabled,
        isPagingEnabled:this.properties.isPagingEnabled,
        isColumnSearchEnabled:this.properties.isColumnSearchEnabled,
        list:this.properties.list,
        selectedExportFunctionalities:this.properties.selectedExportFunctionalities,
        selectedColumns:this.properties.selectedColumns,
        listColumnsWithType:this.properties.listColumnsWithType,
        headerBackgroundColor:this.properties.headerBackgroundColor,
        headerTextColor:this.properties.headerTextColor,
        pagingPosition:this.properties.pagingPosition,
        context: this.context,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected async onPropertyPaneFieldChanged(path,oldValue,newValue) {
    if(path === "list" && (oldValue !== newValue)){
      let web = new Web(this.context.pageContext.web.absoluteUrl);
      let columnsOfList = await web.lists.getById(newValue).fields.get()
      let finalColumnstoSelect = []
      let allColumns = []
      columnsOfList.forEach(field => {
        if ((
              field.Title == "Modified" || 
              field.Title == "Created"
            ) || 
            (!field.Hidden && field["odata.type"] != "SP.FieldComputed" && !field.ReadOnlyField)
          ) {
          finalColumnstoSelect.push({ key: field.InternalName, text:field.Title })
          if (field["odata.type"] === "SP.FieldDateTime") {
            allColumns.push({
              id: field.InternalName,
              label: field.Title,
              type: "DATE",
            })
          } else if (field["odata.type"] === "SP.FieldCurrency") {
            allColumns.push({
              id: field.InternalName,
              label: field.Title,
              type: "CURRENCY"
            })
          } 
          else if (field["odata.type"] === "SP.FieldUrl") {
            allColumns.push({
              id: field.InternalName,
              label: field.Title,
              type: "URL"
            })
          } 
          else if (field["odata.type"] === "SP.FieldMultiLineText" && field["TypeAsString"] === "Thumbnail") {
            allColumns.push({
              id: field.InternalName,
              label: field.Title,
              type: "IMAGE"
            })
          }
          else if (field["odata.type"] === "SP.FieldMultiLineText" || field["odata.type"] === "SP.FieldText") {
            allColumns.push({
              id: field.InternalName,
              label: field.Title,
              type: "TRUNCATED-TEXT"
            })
          }
           else if (field["odata.type"] === "SP.FieldUser") {
            allColumns.push({
              id: field.InternalName,
              label: field.Title,
              type: "USER"
            })
          }
          else {
            allColumns.push({
              id: field.InternalName,
              label: field.Title,
            })
          }
        }
      })
      this.listColumns = finalColumnstoSelect;
      this.properties.listColumnsWithType = allColumns
      this.properties.selectedColumns = []
      this.context.propertyPane.refresh();
      this.render();
    }
  }

  protected async onPropertyPaneConfigurationStart() {
  try {
    let web = new Web(this.context.pageContext.web.absoluteUrl);
    let columnsOfList = await web.lists.getById(this.properties.list).fields.get()
    let finalColumnstoSelect = []
    let allColumns = []
    columnsOfList.forEach(field => {
      if ((
        field.Title == "Modified" ||
        field.Title == "Created"
      ) ||
        (!field.Hidden && field["odata.type"] != "SP.FieldComputed" && !field.ReadOnlyField)
      ) {
        finalColumnstoSelect.push({ key: field.InternalName, text: field.Title })
        if (field["odata.type"] === "SP.FieldDateTime") {
          allColumns.push({
            id: field.InternalName,
            label: field.Title,
            type: "DATE",
          })
        } else if (field["odata.type"] === "SP.FieldCurrency") {
          allColumns.push({
            id: field.InternalName,
            label: field.Title,
            type: "CURRENCY"
          })
        } else if (field["odata.type"] === "SP.Field" && field["TypeAsString"] === "Boolean") {
        allColumns.push({
          id: field.InternalName,
          label: field.Title,
          type: "BOOLEAN"
        })
      }
        else if (field["odata.type"] === "SP.FieldUrl") {
          allColumns.push({
            id: field.InternalName,
            label: field.Title,
            type: "URL"
          })
        }
        else if (field["odata.type"] === "SP.FieldMultiLineText" && field["TypeAsString"] === "Thumbnail") {
          allColumns.push({
            id: field.InternalName,
            label: field.Title,
            type: "IMAGE"
          })
        }
        else if (field["odata.type"] === "SP.FieldMultiLineText" || field["odata.type"] === "SP.FieldText") {
          allColumns.push({
            id: field.InternalName,
            label: field.Title,
            type: "TRUNCATED-TEXT"
          })
        } else if (field["odata.type"] === "SP.FieldUser") {
          allColumns.push({
            id: field.InternalName,
            label: field.Title,
            type: "USER"
          })
        }
        else {
          allColumns.push({
            id: field.InternalName,
            label: field.Title,
          })
        }
      }
    })

    this.listColumns = finalColumnstoSelect;
    this.properties.listColumnsWithType = allColumns
    this.context.propertyPane.refresh();
    this.render();
  } catch (error) {
    console.log(error)
  }
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyFieldListPicker('list', {
                  label: 'Select a list',
                  selectedList: this.properties.list,
                  includeHidden: false,
                  orderBy: PropertyFieldListPickerOrderBy.Title,
                  disabled: false,
                  onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
                  properties: this.properties,
                  context: this.context,
                  onGetErrorMessage: null,
                  deferredValidationTime: 0,
                  key: 'listPickerFieldId'
                }),
                PropertyFieldMultiSelect('selectedColumns', {
                  key: 'selectedColumns',
                  label: "Select Columns to display in grid",
                  options: this.listColumns,
                  selectedKeys: this.properties.selectedColumns
                }),
                PropertyFieldMultiSelect('selectedExportFunctionalities', {
                  key: 'selectedExportFunctionalities',
                  label: strings.selectedExportFunctionalitiesLabel,
                  options: [
                    { key: "CSV", text: "CSV" },
                    { key: "PDF", text: "PDF" },
                    { key: "Print", text: "Print" },
                    { key: "Excel", text: "Excel" }
                  ],
                  selectedKeys: this.properties.selectedExportFunctionalities
                }),
                PropertyPaneDropdown("pagingPosition",{
                  label:strings.pagingPositionLabel,
                  options:[
                    {
                      key:"top-left",
                      text:"Top Left"
                    },
                    {
                      key: "top-right",
                      text: "Top Right"
                    },
                    {
                      key: "bottom-left",
                      text: "Bottom Left"
                    },
                    {
                      key: "bottom-right",
                      text: "Bottom Right"
                    }
                  ],
                  disabled:!this.properties.isPagingEnabled,
                  selectedKey:this.properties.pagingPosition
                }),
                PropertyPaneToggle("isGroupingEnabled",{
                  label:strings.GroupingToggleLabel
                }),
                PropertyPaneToggle("isColumnSearchEnabled", {
                  label: strings.ColumnSearchToggleLabel
                }),
                PropertyPaneToggle("isPagingEnabled", {
                  label: strings.PagingToggleLabel
                }),
                PropertyFieldColorPicker('headerBackgroundColor', {
                  label: strings.headerBackgroundColorLabel,
                  selectedColor: this.properties.headerBackgroundColor,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  disabled: false,
                  isHidden: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Inline,
                  iconName: 'Precipitation',
                  key: 'headerBackgroundColorFieldId'
                }),
                PropertyFieldColorPicker('headerTextColor', {
                  label: strings.headerTextColorLabel,
                  selectedColor: this.properties.headerTextColor,
                  onPropertyChange: this.onPropertyPaneFieldChanged,
                  properties: this.properties,
                  disabled: false,
                  isHidden: false,
                  alphaSliderHidden: false,
                  style: PropertyFieldColorPickerStyle.Inline,
                  key: 'headerBackgroundColorFieldId'
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
