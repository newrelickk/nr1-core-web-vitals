import React from 'react';
import PropTypes from 'prop-types';
import {StackedBarChart, BillboardChart, Icon, Grid, GridItem, Tooltip} from 'nr1';

//create chart data with single value
function createChartData(name, value, unit, color) {
    return {
        metadata: {
            id: name,
            viz: 'main',
            name: name,
            color: color,
            units_data: {
                y: unit,
            }
        },
        data: [
            {y: value},
        ],
    };
}

//create chart data for StackedBarChart
function createStackedBarChartData(values) {
    const colors = ["#0CCE6B", "#FFA400", "#FF4E42"];
    const names = ["GOOD", "NEEDS IMPROVEMENT", "POOR"];
    return values.map(function(value, idx) {
        return createChartData(names[idx], value, 'COUNT', colors[idx]);
    });
}


export function VitalItem(props) {
    const iconParams = [
        {color: 'green', icon: Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__BROWSER__A_CHECKED},
        {color: 'orange', icon: Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__BROWSER__S_WARNING},
        {color: 'red', icon: Icon.TYPE.HARDWARE_AND_SOFTWARE__SOFTWARE__BROWSER__S_ERROR},
    ];
    return (
        <Grid style={{"height":props.height}}>
            <GridItem columnSpan={4}>
                <Tooltip text={props.description}>
                    <div style={{"font-size":props.height*0.2}}>{props.title} <Icon type={iconParams[props.level].icon} color={iconParams[props.level].color} /></div>
                </Tooltip>
                <BillboardChart data={[createChartData(props.title, props.percentileValue, props.percentileUnit, null)]} style={{"height":props.height*0.65}} />
            </GridItem>
            <GridItem columnSpan={8}>
                <StackedBarChart data={createStackedBarChartData(props.countValues)} fullWidth />
            </GridItem>
        </Grid>
    )
}

VitalItem.propTypes = {
    percentileValue: PropTypes.number,
    percentileUnit: PropTypes.string,
    countValues: PropTypes.arrayOf(PropTypes.number),
    title: PropTypes.string,
    level: PropTypes.number,
    height: PropTypes.number,
    description: PropTypes.string
};