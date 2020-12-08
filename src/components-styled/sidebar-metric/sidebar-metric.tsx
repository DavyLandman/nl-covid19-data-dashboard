import { assert } from '~/utils/assert';
import { get } from 'lodash';
import { isDefined } from 'ts-is-present';
import { Box } from '~/components-styled/base';
import { SidebarBarScale } from './sidebar-barscale';
import { SidebarKpiValue } from './sidebar-kpi-value';
import { replaceVariablesInText } from '~/utils/replaceVariablesInText';
import { formatDateFromSeconds } from '~/utils/formatDate';
import siteText, { TALLLanguages } from '~/locale/index';
import { getMetricConfig, DataScope } from '~/metric-config';
import {
  MetricKeys /* DifferenceKeys */,
} from '~/components/choropleth/shared';

interface SidebarMetricProps<T extends { difference: unknown }> {
  scope: DataScope;
  data: T;
  metricName: ValueOf<MetricKeys<T>>;
  metricProperty: string;
  localeTextKey: keyof TALLLanguages;
  // differenceKey?: ValueOf<DifferenceKeys<T>>;
  differenceKey?: string;
  showBarScale?: boolean;
  isWeeklyData?: boolean;
  annotationKey?: string;

  /**
   * Sometimes the barscale is not showing the same metric. Also since data
   * is not properly unified yet, the bar scale can point to both a different
   * metric name and metric property.
   */
  altBarScaleMetric?: {
    metricName: ValueOf<MetricKeys<T>>;
    metricProperty: string;
  };
}

export function SidebarMetric<T extends { difference: unknown }>({
  scope,
  data,
  metricName,
  metricProperty,
  localeTextKey,
  differenceKey,
  showBarScale,
  annotationKey,
  altBarScaleMetric,
}: SidebarMetricProps<T>) {
  const lastValue = get(data, [
    (metricName as unknown) as string,
    'last_value',
  ]);
  const propertyValue = lastValue && lastValue[metricProperty];

  assert(
    isDefined(propertyValue),
    `Missing value for metric property ${[
      metricName,
      'last_value',
      metricProperty,
    ]
      .filter(isDefined)
      .join(':')}`
  );

  const config = getMetricConfig(
    scope,
    (metricName as unknown) as string,
    metricProperty
  );
  const commonText = siteText.common.metricKPI;

  const title = get(siteText, [localeTextKey, 'kpi_titel']);
  assert(title, `Missing title at ${localeTextKey}.kpi_titel`);

  const description = config.isWeeklyData
    ? replaceVariablesInText(commonText.dateRangeOfReport, {
        startDate: formatDateFromSeconds(lastValue.week_start_unix, 'axis'),
        endDate: formatDateFromSeconds(lastValue.week_end_unix, 'axis'),
      })
    : replaceVariablesInText(commonText.dateOfReport, {
        dateOfReport: formatDateFromSeconds(
          lastValue.date_of_report_unix,
          'medium'
        ),
      });

  const differenceValue = differenceKey
    ? get(data, ['difference', (differenceKey as unknown) as string])
    : undefined;

  if (differenceKey) {
    /**
     * If you pass in a difference key, it should exist
     */
    assert(
      isDefined(differenceValue),
      `Missing value for difference:${differenceKey}`
    );
  }

  const valueAnnotation = annotationKey
    ? get(siteText, ['waarde_annotaties', annotationKey])
    : undefined;

  if (annotationKey) {
    /**
     * If you pass in an annotation key, it should exist
     */
    assert(
      valueAnnotation,
      `Missing value annotation at waarde_annotaties:${annotationKey}`
    );
  }

  return (
    <Box spacing={1} mx={'2.5rem'}>
      <SidebarKpiValue
        title={title}
        value={propertyValue}
        isPercentage={config.isPercentage}
        description={description}
        difference={differenceValue}
      />
      {showBarScale && (
        <SidebarBarScale
          data={data}
          scope={scope}
          localeTextKey={localeTextKey}
          metricName={
            altBarScaleMetric ? altBarScaleMetric.metricName : metricName
          }
          metricProperty={
            altBarScaleMetric
              ? altBarScaleMetric.metricProperty
              : metricProperty
          }
        />
      )}
    </Box>
  );
}