import { formatNumber } from '@corona-dashboard/common';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Ziekenhuis from '~/assets/ziekenhuis.svg';
import { Box } from '~/components-styled/base';
import { ChoroplethTile } from '~/components-styled/choropleth-tile';
import { ContentHeader } from '~/components-styled/content-header';
import { KpiTile } from '~/components-styled/kpi-tile';
import { KpiValue } from '~/components-styled/kpi-value';
import { LineChartTile } from '~/components-styled/line-chart-tile';
import { addBackgroundRectangleCallback } from '~/components-styled/line-chart/components/chart-axes/component-callbacks/add-background-rectangle-callback';
import { PageBarScale } from '~/components-styled/page-barscale';
import { TileList } from '~/components-styled/tile-list';
import { TwoKpiSection } from '~/components-styled/two-kpi-section';
import { Text } from '~/components-styled/typography';
import { municipalThresholds } from '~/components/choropleth/municipal-thresholds';
import { MunicipalityChoropleth } from '~/components/choropleth/municipality-choropleth';
import { regionThresholds } from '~/components/choropleth/region-thresholds';
import { SafetyRegionChoropleth } from '~/components/choropleth/safety-region-choropleth';
import { createSelectMunicipalHandler } from '~/components/choropleth/select-handlers/create-select-municipal-handler';
import { createSelectRegionHandler } from '~/components/choropleth/select-handlers/create-select-region-handler';
import { createMunicipalHospitalAdmissionsTooltip } from '~/components/choropleth/tooltips/municipal/create-municipal-hospital-admissions-tooltip';
import { createRegionHospitalAdmissionsTooltip } from '~/components/choropleth/tooltips/region/create-region-hospital-admissions-tooltip';
import { SEOHead } from '~/components-styled/seo-head';
import { FCWithLayout } from '~/domain/layout/layout';
import { getNationalLayout } from '~/domain/layout/national-layout';
import siteText from '~/locale/index';
import { createGetStaticProps } from '~/static-props/create-get-static-props';
import {
  createGetChoroplethData,
  getLastGeneratedDate,
  getNlData,
} from '~/static-props/get-data';
import { colors } from '~/style/theme';
import { formatDateFromMilliseconds } from '~/utils/formatDate';
import { getTrailingDateRange } from '~/utils/get-trailing-date-range';

const text = siteText.ziekenhuisopnames_per_dag;
const graphDescriptions = siteText.accessibility.grafieken;

export const getStaticProps = createGetStaticProps(
  getLastGeneratedDate,
  getNlData,
  createGetChoroplethData({
    vr: ({ hospital_nice }) => ({ hospital_nice }),
    gm: ({ hospital_nice }) => ({ hospital_nice }),
  })
);

const IntakeHospital: FCWithLayout<typeof getStaticProps> = (props) => {
  const { data, choropleth } = props;
  const router = useRouter();
  const [selectedMap, setSelectedMap] = useState<'municipal' | 'region'>(
    'region'
  );
  const dataHospitalNice = data.hospital_nice;
  const dataHospitalLcps = data.hospital_lcps;
  const lastValueNice = data.hospital_nice.last_value;
  const lastValueLcps = data.hospital_lcps.last_value;

  const underReportedRange = getTrailingDateRange(dataHospitalNice.values, 4);

  return (
    <>
      <SEOHead
        title={text.metadata.title}
        description={text.metadata.description}
      />
      <TileList>
        <ContentHeader
          category={siteText.nationaal_layout.headings.ziekenhuizen}
          screenReaderCategory={
            siteText.ziekenhuisopnames_per_dag.titel_sidebar
          }
          title={text.titel}
          icon={<Ziekenhuis />}
          subtitle={text.pagina_toelichting}
          metadata={{
            datumsText: text.datums,
            dateOrRange: lastValueNice.date_unix,
            dateOfInsertionUnix: lastValueNice.date_of_insertion_unix,
            dataSources: [text.bronnen.nice, text.bronnen.lnaz],
          }}
          reference={text.reference}
        />

        <TwoKpiSection>
          <KpiTile
            title={text.barscale_titel}
            description={text.extra_uitleg}
            metadata={{
              date: lastValueNice.date_unix,
              source: text.bronnen.nice,
            }}
          >
            <PageBarScale
              data={data}
              scope="nl"
              metricName="hospital_nice"
              metricProperty="admissions_on_date_of_reporting"
              localeTextKey="ziekenhuisopnames_per_dag"
              differenceKey="hospital_nice__admissions_on_date_of_reporting"
            />
          </KpiTile>

          <KpiTile
            title={text.kpi_bedbezetting.title}
            description={text.kpi_bedbezetting.description}
            metadata={{
              date: lastValueLcps.date_unix,
              source: text.bronnen.lnaz,
            }}
          >
            <KpiValue
              data-cy="beds_occupied_covid"
              absolute={lastValueLcps.beds_occupied_covid}
              difference={data.difference.hospital_lcps__beds_occupied_covid}
            />
          </KpiTile>
        </TwoKpiSection>

        <ChoroplethTile
          title={text.map_titel}
          description={text.map_toelichting}
          onChartRegionChange={setSelectedMap}
          chartRegion={selectedMap}
          legend={{
            thresholds:
              selectedMap === 'municipal'
                ? municipalThresholds.hospital_nice
                    .admissions_on_date_of_reporting
                : regionThresholds.hospital_nice
                    .admissions_on_date_of_reporting,
            title: text.chloropleth_legenda.titel,
          }}
          metadata={{
            date: lastValueNice.date_unix,
            source: text.bronnen.nice,
          }}
        >
          {selectedMap === 'municipal' && (
            <MunicipalityChoropleth
              data={choropleth.gm}
              metricName="hospital_nice"
              metricProperty="admissions_on_date_of_reporting"
              tooltipContent={createMunicipalHospitalAdmissionsTooltip(
                createSelectMunicipalHandler(router, 'ziekenhuis-opnames')
              )}
              onSelect={createSelectMunicipalHandler(
                router,
                'ziekenhuis-opnames'
              )}
            />
          )}
          {selectedMap === 'region' && (
            <SafetyRegionChoropleth
              data={choropleth.vr}
              metricName="hospital_nice"
              metricProperty="admissions_on_date_of_reporting"
              tooltipContent={createRegionHospitalAdmissionsTooltip(
                createSelectRegionHandler(router, 'ziekenhuis-opnames')
              )}
              onSelect={createSelectRegionHandler(router, 'ziekenhuis-opnames')}
            />
          )}
        </ChoroplethTile>

        <LineChartTile
          title={text.linechart_titel}
          description={text.linechart_description}
          ariaDescription={graphDescriptions.ziekenhuisopnames}
          values={dataHospitalNice.values}
          signaalwaarde={40}
          formatTooltip={(values) => {
            const value = values[0];
            const isInrange = value.__date >= underReportedRange[0];
            return (
              <>
                <Box display="flex" alignItems="center" flexDirection="column">
                  {isInrange && (
                    <Text as="span" fontSize={0} color={colors.annotation}>
                      ({siteText.common.incomplete})
                    </Text>
                  )}
                  <Box>
                    <Text as="span" fontWeight="bold">
                      {`${formatDateFromMilliseconds(
                        value.__date.getTime()
                      )}: `}
                    </Text>
                    {formatNumber(value.__value)}
                  </Box>
                </Box>
              </>
            );
          }}
          linesConfig={[
            {
              metricProperty: 'admissions_on_date_of_admission',
            },
          ]}
          metadata={{
            source: text.bronnen.nice,
          }}
          componentCallback={addBackgroundRectangleCallback(
            underReportedRange,
            {
              fill: colors.data.underReported,
            }
          )}
          legendItems={[
            {
              color: colors.data.primary,
              label: text.linechart_legend_titel,
              shape: 'line',
            },
            {
              color: colors.data.underReported,
              label: text.linechart_legend_underreported_titel,
              shape: 'square',
            },
          ]}
          showLegend
        />

        <LineChartTile
          title={text.chart_bedbezetting.title}
          description={text.chart_bedbezetting.description}
          values={dataHospitalLcps.values}
          linesConfig={[
            {
              metricProperty: 'beds_occupied_covid',
            },
          ]}
          metadata={{
            source: text.bronnen.lnaz,
          }}
        />
      </TileList>
    </>
  );
};

IntakeHospital.getLayout = getNationalLayout;

export default IntakeHospital;
