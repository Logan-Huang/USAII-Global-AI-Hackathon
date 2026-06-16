package org.asylumaid.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import org.asylumaid.i18n.Countries
import org.asylumaid.state.AppViewModel
import org.asylumaid.ui.theme.AA
import org.asylumaid.ui.theme.Metrics

private val GENDER_OPTIONS = listOf(
    "Female" to "genderFemale", "Male" to "genderMale",
    "Non-binary" to "genderNonBinary", "Prefer not to say" to "genderPreferNot",
)
private val CIVIL_OPTIONS = listOf(
    "Single" to "civilSingle", "Married" to "civilMarried", "Divorced" to "civilDivorced",
    "Widowed" to "civilWidowed", "Separated" to "civilSeparated", "Prefer not to say" to "civilPreferNot",
)

/**
 * Intake form: collects the profile (3 required + 3 optional fields) and starts the chat.
 * Required fields are enforced in the ViewModel, matching the web/iOS clients.
 */
@Composable
fun IntakeFormScreen(app: AppViewModel) {
    var originCode by remember { mutableStateOf("") }
    var asylumCode by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var gender by remember { mutableStateOf("") }   // stable English value, "" = unspecified
    var civil by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    Column(
        Modifier
            .fillMaxSize()
            .background(AA.bg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Text(app.t("intakeHeading"), color = AA.text, fontSize = 18.sp, fontWeight = FontWeight.Bold)
        Text(app.t("intakeSubheading"), color = AA.textMuted, fontSize = 13.sp)

        // Privacy notice card
        Column(
            Modifier
                .fillMaxWidth()
                .background(AA.primaryLight, RoundedCornerShape(Metrics.radiusMd))
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Text(app.t("privacyHeading"), color = AA.primaryDark, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            Text(app.t("privacyNotice"), color = AA.text, fontSize = 13.sp)
        }

        CountryField(app.t("countryOfOriginLabel"), app.t("countrySelectPlaceholder"), app.lang, originCode) { originCode = it }
        CountryField(app.t("countryOfAsylumLabel"), app.t("countrySelectPlaceholder"), app.lang, asylumCode) { asylumCode = it }

        FieldLabel(app.t("currentLocationLabel"))
        OutlinedTextField(
            value = location, onValueChange = { location = it },
            placeholder = { Text(app.t("currentLocationPlaceholder")) },
            singleLine = true, modifier = Modifier.fillMaxWidth(),
        )

        ChoiceField(app.t("genderLabel"), app.t("choosePlaceholder"), GENDER_OPTIONS, gender, app) { gender = it }
        ChoiceField(app.t("civilStatusLabel"), app.t("choosePlaceholder"), CIVIL_OPTIONS, civil, app) { civil = it }

        FieldLabel(app.t("notesLabel"))
        OutlinedTextField(
            value = notes, onValueChange = { notes = it },
            placeholder = { Text(app.t("notesPlaceholder")) },
            minLines = 2, maxLines = 5, modifier = Modifier.fillMaxWidth(),
        )

        app.globalError?.let { err ->
            Text(
                err, color = AA.errorText, fontSize = 13.sp, fontWeight = FontWeight.Medium,
                modifier = Modifier.fillMaxWidth()
                    .background(AA.errorBg, RoundedCornerShape(Metrics.radiusSm)).padding(10.dp),
            )
        }

        Button(
            onClick = {
                app.submitIntake(originCode, asylumCode, location, gender, civil, notes)
            },
            colors = ButtonDefaults.buttonColors(containerColor = AA.accent, contentColor = AA.surface),
            shape = RoundedCornerShape(Metrics.radiusMd),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(app.t("submitButton"), fontSize = 16.sp, fontWeight = FontWeight.Bold, modifier = Modifier.padding(vertical = 4.dp))
        }
        Text(app.t("requiredNote"), color = AA.textMuted, fontSize = 12.sp)
    }
}

@Composable
private fun FieldLabel(text: String) {
    Text(text, color = AA.text, fontSize = 13.sp, fontWeight = FontWeight.Medium)
}

// MARK: - Country field (opens a searchable dialog)

@Composable
private fun CountryField(label: String, placeholder: String, lang: String, code: String, onSelect: (String) -> Unit) {
    var open by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        FieldLabel(label)
        Row(
            Modifier.fillMaxWidth()
                .border(1.dp, AA.border, RoundedCornerShape(Metrics.radiusMd))
                .clickable { open = true }
                .padding(horizontal = 12.dp, vertical = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            Text(
                if (code.isEmpty()) placeholder else Countries.localizedName(code, lang),
                color = if (code.isEmpty()) AA.textMuted else AA.text, fontSize = 15.sp,
            )
            Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = AA.textMuted)
        }
    }
    if (open) {
        CountryPickerDialog(lang, code, onDismiss = { open = false }) { onSelect(it); open = false }
    }
}

@Composable
private fun CountryPickerDialog(lang: String, selected: String, onDismiss: () -> Unit, onPick: (String) -> Unit) {
    var query by remember { mutableStateOf("") }
    val list = remember(query) {
        val all = Countries.sorted(lang)
        val q = query.trim().lowercase()
        if (q.isEmpty()) all else all.filter { it.second.lowercase().contains(q) }
    }
    Dialog(onDismissRequest = onDismiss) {
        Surface(
            Modifier.fillMaxWidth().fillMaxHeight(0.85f),
            color = AA.surface, shape = RoundedCornerShape(Metrics.radiusMd),
        ) {
            Column(Modifier.padding(12.dp)) {
                OutlinedTextField(
                    value = query, onValueChange = { query = it },
                    singleLine = true, modifier = Modifier.fillMaxWidth(),
                )
                LazyColumn(Modifier.fillMaxSize()) {
                    items(list.size, key = { list[it].first }) { idx ->
                        val (c, name) = list[idx]
                        Row(
                            Modifier.fillMaxWidth().clickable { onPick(c) }.padding(vertical = 12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(name, color = AA.text, fontSize = 15.sp)
                            if (c == selected) Icon(Icons.Filled.Check, contentDescription = null, tint = AA.primary)
                        }
                        Divider(color = AA.borderLight)
                    }
                }
            }
        }
    }
}

// MARK: - Optional choice field (gender / civil status)

@Composable
private fun ChoiceField(
    label: String, placeholder: String, options: List<Pair<String, String>>,
    selection: String, app: AppViewModel, onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    val display = options.firstOrNull { it.first == selection }?.let { app.t(it.second) } ?: placeholder
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        FieldLabel(label)
        Box {
            Row(
                Modifier.fillMaxWidth()
                    .border(1.dp, AA.border, RoundedCornerShape(Metrics.radiusMd))
                    .clickable { expanded = true }
                    .padding(horizontal = 12.dp, vertical = 14.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(display, color = if (selection.isEmpty()) AA.textMuted else AA.text, fontSize = 15.sp)
                Icon(Icons.Filled.ArrowDropDown, contentDescription = null, tint = AA.textMuted)
            }
            DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
                DropdownMenuItem(text = { Text(placeholder) }, onClick = { onSelect(""); expanded = false })
                options.forEach { (value, key) ->
                    DropdownMenuItem(text = { Text(app.t(key)) }, onClick = { onSelect(value); expanded = false })
                }
            }
        }
    }
}
