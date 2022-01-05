import React from 'react';
import PropTypes from 'prop-types';
import {Card, CardBody, HeadingText, NrqlQuery, Spinner, AutoSizer, PlatformStateContext} from 'nr1';
import {VitalItem} from './vital-item.js'



export default class CoreWebVitalsVisualization extends React.Component {
    // Custom props you wish to be configurable in the UI must also be defined in
    // the nr1.json file for the visualization. See docs for more details.
    static propTypes = {
        targetUrl: PropTypes.string,
        useLike: PropTypes.bool,
        accountId: PropTypes.number
    };

    //get value from query result
    getItemValue = (src, idx, key) => {
        return src[idx].data[0][key];
    };

    //get values from query results
    getItemValues = (t, src, startIdx, keys) => {
        return keys.map(function(key, idx) {
            return t.getItemValue(src, startIdx + idx, key);
        });
    };

    //get level from percentile value.
    getLevel = (value, thresholds) => {
        return thresholds.filter(function (threshold) {
            return value > threshold;
        }).length;
    };


    render() {
        const {targetUrl, useLike, accountId} = this.props;
        const nrqlQueryPropsAvailable = targetUrl && targetUrl.length > 0 && accountId && accountId > 0;
        const baseQuery =
            "SELECT percentile(largestContentfulPaint, 75) * 1000 as 'LCP',percentile(firstInputDelay, 75) as 'FID' ,percentile(cumulativeLayoutShift, 75) as 'CLS',\n" +
            "filter(count(*),WHERE largestContentfulPaint <= 2.5) as 'LCP_0', filter(count(*),WHERE largestContentfulPaint > 2.5 AND largestContentfulPaint <= 4) as 'LCP_1', filter(count(*),WHERE largestContentfulPaint > 4) as 'LCP_2',\n" +
            "filter(count(*),WHERE firstInputDelay <= 100) as 'FID_0', filter(count(*),WHERE firstInputDelay > 100 AND firstInputDelay <= 300) as 'FID_1', filter(count(*),WHERE firstInputDelay > 300) as 'FID_2',\n" +
            "filter(count(*),WHERE cumulativeLayoutShift <= 0.1) as 'CLS_0', filter(count(*),WHERE cumulativeLayoutShift > 0.1 AND cumulativeLayoutShift <= 0.25) as 'CLS_1', filter(count(*),WHERE cumulativeLayoutShift > 0.25) as 'CLS_2', \n" +
            "count(*) as count \n" +
            "FROM PageViewTiming WHERE pageUrl ";
        const myQuery = baseQuery + (useLike ? "LIKE '" : "= '") + targetUrl + "'";

        if(!nrqlQueryPropsAvailable) {
            return <EmptyState />;
        }

        const itemParams = [
            {
                name: 'LCP',
                unit:'MS',
                keys: ['LCP_0', 'LCP_1', 'LCP_2'],
                indexes: [0, 3],
                description: 'Largest Contentful Paint. 75 percentile value shall be 2.5 sec or less.',
                thresholds: [2.5*1000, 4*1000],
            },
            {
                name: 'FID',
                unit:'MS',
                keys: ['FID_0', 'FID_1', 'FID_2'],
                indexes: [1, 6],
                description: 'First Input Delay. 75 percentile value shall be 100 ms or less.',
                thresholds: [100, 300],
            },
            {
                name: 'CLS',
                unit:'MS',
                keys: ['CLS_0', 'CLS_1', 'CLS_2'],
                indexes: [2, 9],
                description: 'Cumulative Layout Shift. 75 percentile value shall be 0.1 or less.',
                thresholds: [0.1, 0.25],
            },
        ];

        return (
            <PlatformStateContext.Consumer>
                {(platformState) => {
                    return(
                        <NrqlQuery
                            query={myQuery}
                            accountIds={[accountId]}
                            pollInterval={NrqlQuery.AUTO_POLL_INTERVAL}
                            timeRange={platformState.timeRange}
                        >
                            {({data, loading, error}) => {
                                if(loading) {
                                    return <Spinner />;
                                }
                                if(error) {
                                    console.log(error.message);
                                    return <ErrorState />;
                                }
                                const count = data[12].data[0]["count"];
                                if (count <= 0) {
                                    return <NoData />;
                                }
                                return (
                                    <AutoSizer>
                                        {({width, height}) => (
                                            <>
                                                { itemParams.map((param) => {
                                                    let value = this.getItemValue(data, param.indexes[0], param.name);
                                                    return (
                                                        <VitalItem
                                                            title={param.name}
                                                            percentileValue={value}
                                                            percentileUnit={param.unit}
                                                            countValues={this.getItemValues(this, data, param.indexes[1], param.keys)}
                                                            level={this.getLevel(value, param.thresholds)}
                                                            height={height*0.32}
                                                            description={param.description}
                                                        />
                                                    );
                                                })}
                                            </>
                                        )}
                                    </AutoSizer>
                                )
                            }}
                        </NrqlQuery>
                    )
                }}
            </PlatformStateContext.Consumer>
        );
    }
}

const EmptyState = () => (
    <AutoSizer>
        {({width, height}) => (
            <Card className="EmptyState">
                <CardBody className="EmptyState-cardBody" style={{"width":width-32, "height":height-32}}>
                    <HeadingText
                        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                        type={HeadingText.TYPE.HEADING_3}
                    >
                        Please provide PageUrl and Account ID
                    </HeadingText>
                </CardBody>
            </Card>
        )}
    </AutoSizer>
);

const ErrorState = () => (
    <AutoSizer>
        {({width, height}) => (
            <Card className="ErrorState">
                <CardBody className="ErrorState-cardBody" style={{"width":width-32, "height":height-32}}>
                    <HeadingText
                        className="ErrorState-headingText"
                        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                        type={HeadingText.TYPE.HEADING_3}
                    >
                        Oops! Something went wrong.
                    </HeadingText>
                </CardBody>
            </Card>
        )}
    </AutoSizer>
);


const NoData = () => (
    <AutoSizer>
        {({width, height}) => (
            <Card className="EmptyState">
                <CardBody className="EmptyState-cardBody" style={{"width":width-32, "height":height-32}}>
                    <HeadingText
                        spacingType={[HeadingText.SPACING_TYPE.LARGE]}
                        type={HeadingText.TYPE.HEADING_3}
                    >
                        No data matching provided PageUrl.
                    </HeadingText>
                </CardBody>
            </Card>
        )}
    </AutoSizer>
);
