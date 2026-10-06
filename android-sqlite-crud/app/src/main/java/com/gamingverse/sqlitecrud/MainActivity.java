package com.gamingverse.sqlitecrud;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Single screen: a form to insert / update a game, a search box,
 * and a list of results. Tap a row to load it into the form for editing;
 * long-press a row to delete it.
 */
public class MainActivity extends Activity {

    private GameDbHelper dbHelper;

    private EditText inputTitle, inputGenre, inputPlatform, inputPrice, inputSearch;
    private Button btnSave, btnClear;
    private TextView emptyView, formHeading;
    private GameAdapter adapter;

    /** Id of the game being edited, or -1 when the form inserts a new one. */
    private long editingId = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        dbHelper = new GameDbHelper(this);

        formHeading = findViewById(R.id.form_heading);
        inputTitle = findViewById(R.id.input_title);
        inputGenre = findViewById(R.id.input_genre);
        inputPlatform = findViewById(R.id.input_platform);
        inputPrice = findViewById(R.id.input_price);
        inputSearch = findViewById(R.id.input_search);
        btnSave = findViewById(R.id.btn_save);
        btnClear = findViewById(R.id.btn_clear);
        emptyView = findViewById(R.id.empty_view);

        ListView listView = findViewById(R.id.list_games);
        adapter = new GameAdapter();
        listView.setAdapter(adapter);
        listView.setEmptyView(emptyView);

        btnSave.setOnClickListener(v -> saveGame());
        btnClear.setOnClickListener(v -> resetForm());

        listView.setOnItemClickListener((parent, view, position, id) ->
                startEditing(adapter.getItem(position)));
        listView.setOnItemLongClickListener((parent, view, position, id) -> {
            confirmDelete(adapter.getItem(position));
            return true;
        });

        inputSearch.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) { refreshList(); }
        });

        refreshList();
    }

    @Override
    protected void onDestroy() {
        dbHelper.close();
        super.onDestroy();
    }

    // INSERT or UPDATE depending on whether a row is loaded into the form.
    private void saveGame() {
        String title = inputTitle.getText().toString().trim();
        String genre = inputGenre.getText().toString().trim();
        String platform = inputPlatform.getText().toString().trim();
        String priceText = inputPrice.getText().toString().trim();

        if (TextUtils.isEmpty(title)) {
            inputTitle.setError(getString(R.string.error_title_required));
            inputTitle.requestFocus();
            return;
        }

        double price = 0;
        if (!priceText.isEmpty()) {
            try {
                price = Double.parseDouble(priceText);
            } catch (NumberFormatException e) {
                inputPrice.setError(getString(R.string.error_price_invalid));
                inputPrice.requestFocus();
                return;
            }
        }

        if (editingId == -1) {
            long newId = dbHelper.insertGame(new Game(title, genre, platform, price));
            toast(newId == -1 ? R.string.msg_insert_failed : R.string.msg_inserted);
        } else {
            int rows = dbHelper.updateGame(new Game(editingId, title, genre, platform, price));
            toast(rows > 0 ? R.string.msg_updated : R.string.msg_update_failed);
        }

        resetForm();
        refreshList();
    }

    private void startEditing(Game game) {
        editingId = game.getId();
        inputTitle.setText(game.getTitle());
        inputGenre.setText(game.getGenre());
        inputPlatform.setText(game.getPlatform());
        inputPrice.setText(game.getPrice() == 0 ? "" : String.valueOf(game.getPrice()));
        formHeading.setText(R.string.heading_edit);
        btnSave.setText(R.string.btn_update);
        btnClear.setText(R.string.btn_cancel);
        inputTitle.requestFocus();
    }

    private void resetForm() {
        editingId = -1;
        inputTitle.setText("");
        inputGenre.setText("");
        inputPlatform.setText("");
        inputPrice.setText("");
        inputTitle.setError(null);
        inputPrice.setError(null);
        formHeading.setText(R.string.heading_add);
        btnSave.setText(R.string.btn_insert);
        btnClear.setText(R.string.btn_clear);
    }

    // DELETE, after confirmation.
    private void confirmDelete(Game game) {
        new AlertDialog.Builder(this)
                .setTitle(R.string.dialog_delete_title)
                .setMessage(getString(R.string.dialog_delete_message, game.getTitle()))
                .setPositiveButton(R.string.btn_delete, (dialog, which) -> {
                    int rows = dbHelper.deleteGame(game.getId());
                    toast(rows > 0 ? R.string.msg_deleted : R.string.msg_delete_failed);
                    if (game.getId() == editingId) {
                        resetForm();
                    }
                    refreshList();
                })
                .setNegativeButton(android.R.string.cancel, null)
                .show();
    }

    // SEARCH: re-query using the current search text.
    private void refreshList() {
        String keyword = inputSearch.getText().toString();
        List<Game> games = dbHelper.searchGames(keyword);
        adapter.setGames(games);
        emptyView.setText(keyword.trim().isEmpty()
                ? getString(R.string.empty_no_games)
                : getString(R.string.empty_no_results, keyword.trim()));
    }

    private void toast(int messageRes) {
        Toast.makeText(this, messageRes, Toast.LENGTH_SHORT).show();
    }

    private class GameAdapter extends ArrayAdapter<Game> {
        GameAdapter() {
            super(MainActivity.this, R.layout.item_game, new ArrayList<>());
        }

        void setGames(List<Game> games) {
            clear();
            addAll(games);
            notifyDataSetChanged();
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            View row = convertView != null ? convertView
                    : LayoutInflater.from(getContext()).inflate(R.layout.item_game, parent, false);
            Game game = getItem(position);

            ((TextView) row.findViewById(R.id.item_title)).setText(game.getTitle());
            ((TextView) row.findViewById(R.id.item_details)).setText(
                    joinNonEmpty(game.getGenre(), game.getPlatform()));
            ((TextView) row.findViewById(R.id.item_price)).setText(
                    String.format(Locale.getDefault(), "₹%.2f", game.getPrice()));
            ((TextView) row.findViewById(R.id.item_id)).setText("#" + game.getId());
            return row;
        }

        private String joinNonEmpty(String a, String b) {
            boolean hasA = !TextUtils.isEmpty(a), hasB = !TextUtils.isEmpty(b);
            if (hasA && hasB) return a + " · " + b;
            if (hasA) return a;
            if (hasB) return b;
            return "—";
        }
    }
}
